BEGIN;

-- ---------------------------------------------------------------------------
-- Extend companies with richer business details
-- ---------------------------------------------------------------------------

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS annual_turnover numeric(14,2),
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- ---------------------------------------------------------------------------
-- Capture these fields at signup-request time as well (so admins can verify)
-- ---------------------------------------------------------------------------

ALTER TABLE public.company_signup_requests
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS annual_turnover numeric(14,2),
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- ---------------------------------------------------------------------------
-- Update admin review RPC to populate the new company columns
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
      INSERT INTO public.companies (
        name,
        slug,
        status,
        created_by,
        created_via_agent_id,
        metadata,
        business_type,
        annual_turnover,
        website,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        contact_name,
        contact_email,
        contact_phone
      )
      VALUES (
        v_req.company_name,
        v_slug,
        'active',
        v_req.user_id,
        NULL,
        v_req.company_metadata,
        NULLIF(btrim(v_req.business_type), ''),
        v_req.annual_turnover,
        NULLIF(btrim(v_req.website), ''),
        NULLIF(btrim(v_req.address_line1), ''),
        NULLIF(btrim(v_req.address_line2), ''),
        NULLIF(btrim(v_req.city), ''),
        NULLIF(btrim(v_req.state), ''),
        NULLIF(btrim(v_req.postal_code), ''),
        NULLIF(btrim(v_req.country), ''),
        NULLIF(btrim(v_req.contact_name), ''),
        NULLIF(btrim(v_req.contact_email), ''),
        NULLIF(btrim(v_req.contact_phone), '')
      )
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

  -- Ensure single-primary constraint is satisfied.
  UPDATE public.company_memberships
  SET is_primary = false
  WHERE user_id = v_req.user_id
    AND is_primary = true;

  -- Company insert trigger creates owner membership; upgrade it to admin and primary.
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

NOTIFY pgrst, 'reload schema';

COMMIT;

