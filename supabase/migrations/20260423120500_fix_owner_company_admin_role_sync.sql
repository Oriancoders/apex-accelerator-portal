BEGIN;

-- Owner memberships must also map to company_admin in app roles.
-- Otherwise company owners end up with app_role = member and cannot access management pages.
CREATE OR REPLACE FUNCTION public.sync_user_role_from_company_memberships(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_role public.app_role;
  v_target_role public.app_role;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT ur.role
  INTO v_current_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id
  LIMIT 1;

  -- Preserve elevated/system roles.
  IF v_current_role IN ('admin'::public.app_role, 'agent'::public.app_role) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = p_user_id
      AND cm.role IN ('owner', 'admin')
  ) THEN
    v_target_role := 'company_admin'::public.app_role;
  ELSE
    v_target_role := 'member'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, v_target_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = EXCLUDED.role
  WHERE public.user_roles.role NOT IN ('admin'::public.app_role, 'agent'::public.app_role);
END;
$$;

-- Backfill once.
WITH target_users AS (
  SELECT DISTINCT cm.user_id
  FROM public.company_memberships cm
)
SELECT public.sync_user_role_from_company_memberships(tu.user_id)
FROM target_users tu;

NOTIFY pgrst, 'reload schema';

COMMIT;

