-- Ensure agents are assigned to companies, not added as company members,
-- when company is created via agent flow.

-- 1) Clean existing bad data:
-- Remove memberships where the member is the same user as created_via_agent_id for that company.
DELETE FROM public.company_memberships cm
USING public.companies c
JOIN public.agents a ON a.id = c.created_via_agent_id
WHERE cm.company_id = c.id
  AND cm.user_id = a.user_id;

-- 2) Backfill missing active assignments for agent-created companies.
INSERT INTO public.agent_company_assignments (company_id, agent_id, status, created_by)
SELECT
  c.id,
  c.created_via_agent_id,
  'active',
  c.created_by
FROM public.companies c
WHERE c.created_via_agent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.agent_company_assignments aca
    WHERE aca.company_id = c.id
      AND aca.agent_id = c.created_via_agent_id
  );

-- 3) Re-assert trigger behavior:
-- If created_via_agent_id exists, assign agent only; otherwise create owner membership.
CREATE OR REPLACE FUNCTION public.handle_new_company_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_via_agent_id IS NOT NULL THEN
    INSERT INTO public.agent_company_assignments (company_id, agent_id, status, created_by)
    VALUES (NEW.id, NEW.created_via_agent_id, 'active', NEW.created_by)
    ON CONFLICT (company_id, agent_id) DO NOTHING;
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

DROP TRIGGER IF EXISTS on_company_created_add_owner ON public.companies;
CREATE TRIGGER on_company_created_add_owner
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_new_company_membership();
