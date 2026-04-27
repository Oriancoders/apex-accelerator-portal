BEGIN;

-- ---------------------------------------------------------------------------
-- Signup approval gating (profiles)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: existing users should not get locked out after this migration.
UPDATE public.profiles
SET is_approved = true
WHERE is_approved = false;

-- ---------------------------------------------------------------------------
-- Company signup requests (admin verifies user + company details)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.company_signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  company_name text NOT NULL,
  requested_company_slug text,
  company_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_signup_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view company signup requests" ON public.company_signup_requests;
CREATE POLICY "Admins can view company signup requests"
ON public.company_signup_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update company signup requests" ON public.company_signup_requests;
CREATE POLICY "Admins can update company signup requests"
ON public.company_signup_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_company_signup_requests_updated_at ON public.company_signup_requests;
CREATE TRIGGER update_company_signup_requests_updated_at
BEFORE UPDATE ON public.company_signup_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Admin review RPC (creates company + makes the user primary company admin)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_review_company_signup_request(
  p_request_id uuid,
  p_approve boolean,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req record;
  v_company_id uuid;
  v_base_slug text;
  v_slug text;
  v_suffix int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admin can review signup requests.';
  END IF;

  SELECT *
  INTO v_req
  FROM public.company_signup_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Signup request not found.';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Signup request already reviewed.';
  END IF;

  IF NOT p_approve THEN
    UPDATE public.company_signup_requests
    SET
      status = 'rejected',
      review_notes = p_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
    WHERE id = p_request_id;

    RETURN NULL;
  END IF;

  v_base_slug := NULLIF(btrim(v_req.requested_company_slug), '');
  IF v_base_slug IS NULL THEN
    v_base_slug := regexp_replace(lower(v_req.company_name), '[^a-z0-9]+', '-', 'g');
    v_base_slug := regexp_replace(v_base_slug, '(^-+)|(-+$)', '', 'g');
  END IF;

  IF v_base_slug IS NULL OR v_base_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid company slug.';
  END IF;

  v_slug := v_base_slug;
  v_suffix := 0;
  LOOP
    BEGIN
      INSERT INTO public.companies (name, slug, status, created_by, created_via_agent_id, metadata)
      VALUES (v_req.company_name, v_slug, 'active', v_req.user_id, NULL, v_req.company_metadata)
      RETURNING id INTO v_company_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_suffix := v_suffix + 1;
      IF v_suffix > 25 THEN
        RAISE EXCEPTION 'Unable to allocate a unique company slug.';
      END IF;
      v_slug := v_base_slug || '-' || (100 + floor(random() * 900))::int::text;
    END;
  END LOOP;

  -- Company insert trigger creates owner membership; upgrade it to admin and primary.
  UPDATE public.company_memberships
  SET is_primary = false
  WHERE user_id = v_req.user_id
    AND is_primary = true;

  UPDATE public.company_memberships
  SET
    role = 'admin',
    is_primary = true,
    invited_by = auth.uid(),
    updated_at = now()
  WHERE company_id = v_company_id
    AND user_id = v_req.user_id;

  UPDATE public.profiles
  SET
    is_approved = true,
    approved_at = now(),
    approved_by = auth.uid(),
    phone = COALESCE(NULLIF(btrim(v_req.phone), ''), phone),
    updated_at = now()
  WHERE user_id = v_req.user_id;

  UPDATE public.company_signup_requests
  SET
    status = 'approved',
    review_notes = p_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    created_company_id = v_company_id,
    updated_at = now()
  WHERE id = p_request_id;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_review_company_signup_request(uuid, boolean, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Email notifications via existing pg_net -> resend-webhook integration
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_company_signup_request_created_resend ON public.company_signup_requests;
CREATE TRIGGER on_company_signup_request_created_resend
AFTER INSERT ON public.company_signup_requests
FOR EACH ROW
EXECUTE FUNCTION public.invoke_resend_webhook();

DROP TRIGGER IF EXISTS on_company_signup_request_status_resend ON public.company_signup_requests;
CREATE TRIGGER on_company_signup_request_status_resend
AFTER UPDATE ON public.company_signup_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected'))
EXECUTE FUNCTION public.invoke_resend_webhook();

NOTIFY pgrst, 'reload schema';

COMMIT;
