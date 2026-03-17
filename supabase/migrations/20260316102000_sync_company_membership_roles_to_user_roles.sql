-- Keep profile role (public.user_roles) in sync with company membership role changes.
-- Mapping:
--   company_memberships.role = 'admin'  -> user_roles.role = 'company_admin'
--   otherwise                             -> user_roles.role = 'member'
--
-- Safety:
-- Do NOT overwrite platform roles 'admin' and 'agent'.

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
      AND cm.role = 'admin'
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

CREATE OR REPLACE FUNCTION public.handle_company_membership_role_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_user_role_from_company_memberships(OLD.user_id);
    RETURN OLD;
  END IF;

  PERFORM public.sync_user_role_from_company_memberships(NEW.user_id);

  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.sync_user_role_from_company_memberships(OLD.user_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role_from_company_memberships ON public.company_memberships;
CREATE TRIGGER trg_sync_user_role_from_company_memberships
AFTER INSERT OR UPDATE OR DELETE ON public.company_memberships
FOR EACH ROW
EXECUTE FUNCTION public.handle_company_membership_role_sync();

-- Backfill all non-admin/non-agent users once.
WITH target_users AS (
  SELECT DISTINCT cm.user_id
  FROM public.company_memberships cm
)
SELECT public.sync_user_role_from_company_memberships(tu.user_id)
FROM target_users tu;
