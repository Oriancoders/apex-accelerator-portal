-- Ensure creating/updating agents keeps public.user_roles in sync.
-- Rules:
-- 1) If user has an active agent profile => role must be 'agent'
-- 2) If user no longer has active agent profile => fallback to company_admin/member based on memberships
-- 3) Never overwrite platform admin role

CREATE OR REPLACE FUNCTION public.sync_user_role_from_agents(p_user_id uuid)
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

  -- Never overwrite system admin.
  IF v_current_role = 'admin'::public.app_role THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.agents a
    WHERE a.user_id = p_user_id
      AND a.is_active = true
  ) THEN
    v_target_role := 'agent'::public.app_role;
  ELSIF EXISTS (
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
  WHERE public.user_roles.role <> 'admin'::public.app_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_agents_role_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_user_role_from_agents(OLD.user_id);
    RETURN OLD;
  END IF;

  PERFORM public.sync_user_role_from_agents(NEW.user_id);

  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.sync_user_role_from_agents(OLD.user_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role_from_agents ON public.agents;
CREATE TRIGGER trg_sync_user_role_from_agents
AFTER INSERT OR UPDATE OR DELETE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.handle_agents_role_sync();

-- Backfill existing agent users once.
WITH target_users AS (
  SELECT DISTINCT a.user_id
  FROM public.agents a
)
SELECT public.sync_user_role_from_agents(tu.user_id)
FROM target_users tu;
