-- Fix missing RPC used by navbar company switcher:
-- public.set_primary_company(p_company_id uuid)

DROP FUNCTION IF EXISTS public.set_primary_company(uuid);

CREATE OR REPLACE FUNCTION public.set_primary_company(p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  _uid := auth.uid();

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = _uid
      AND cm.company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'You are not a member of this company';
  END IF;

  UPDATE public.company_memberships
  SET is_primary = false
  WHERE user_id = _uid
    AND is_primary = true;

  UPDATE public.company_memberships
  SET is_primary = true
  WHERE user_id = _uid
    AND company_id = p_company_id;

  RETURN p_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_primary_company(uuid) TO authenticated;

-- Ask PostgREST to refresh schema cache so RPC becomes available immediately.
NOTIFY pgrst, 'reload schema';
