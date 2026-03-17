-- Enforce 4-role model and guarantee each profile user has exactly one role.
-- Roles: admin, company_admin, agent (Partner), member

-- IMPORTANT:
-- This is Phase 2. Run after migration 20260315000500_add_new_app_roles.sql
-- so enum values exist in a committed transaction.

-- 1) Migrate legacy roles to the new model
UPDATE public.user_roles
SET role = 'member'::public.app_role
WHERE role IN ('user'::public.app_role, 'moderator'::public.app_role);

-- 2) If a user has multiple roles, keep only one by priority:
-- admin > company_admin > agent > member
WITH ranked_roles AS (
  SELECT
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY CASE role
        WHEN 'admin'::public.app_role THEN 1
        WHEN 'company_admin'::public.app_role THEN 2
        WHEN 'agent'::public.app_role THEN 3
        WHEN 'member'::public.app_role THEN 4
        ELSE 5
      END,
      created_at ASC,
      id ASC
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles ur
USING ranked_roles rr
WHERE ur.id = rr.id
  AND rr.rn > 1;

-- 3) Ensure every profile user has at least one role
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'member'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = p.user_id
);

-- 4) Hard-enforce one role per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_id_unique
ON public.user_roles(user_id);

-- 5) Block legacy enum values from being assigned in new writes
CREATE OR REPLACE FUNCTION public.enforce_allowed_profile_roles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role NOT IN (
    'admin'::public.app_role,
    'company_admin'::public.app_role,
    'agent'::public.app_role,
    'member'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Invalid role: %. Allowed roles are admin, company_admin, agent, member.', NEW.role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_allowed_profile_roles ON public.user_roles;
CREATE TRIGGER trg_enforce_allowed_profile_roles
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_allowed_profile_roles();

-- 6) On new signup, auto-assign member role so every profile has a role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    50
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member'::public.app_role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;