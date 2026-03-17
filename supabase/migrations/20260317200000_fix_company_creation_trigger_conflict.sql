-- Fix company creation trigger conflict target for agent assignments.
-- Root cause: ON CONFLICT (company_id, agent_id) was used without a matching unique/exclusion constraint.

CREATE OR REPLACE FUNCTION public.handle_new_company_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_via_agent_id IS NOT NULL THEN
    -- Avoid 42P10 by not using a conflict target that has no matching unique constraint.
    INSERT INTO public.agent_company_assignments (company_id, agent_id, status, created_by)
    VALUES (NEW.id, NEW.created_via_agent_id, 'active', NEW.created_by)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.company_memberships (company_id, user_id, role, is_primary, invited_by)
    VALUES (
      NEW.id,
      NEW.created_by,
      'owner',
      NOT EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.user_id = NEW.created_by
      ),
      NEW.created_by
    )
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
