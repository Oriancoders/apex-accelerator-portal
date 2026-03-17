-- Fix company creation trigger so agents are assigned instead of becoming owners
-- This prevents agents from appearing as company members and accessing the company dashboard,
-- while correctly showing the company under their agent dashboard assignments.

CREATE OR REPLACE FUNCTION public.handle_new_company_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If created via an agent, assign the agent and DO NOT add as an owner to company memberships
  IF NEW.created_via_agent_id IS NOT NULL THEN
    INSERT INTO public.agent_company_assignments (company_id, agent_id, status, created_by)
    VALUES (NEW.id, NEW.created_via_agent_id, 'active', NEW.created_by);
  ELSE
    -- Mark the first membership as primary; later companies remain non-primary by default.
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

-- Allow agents to manage company memberships for companies they are assigned to
DROP POLICY IF EXISTS "Agents can view company memberships" ON public.company_memberships;
CREATE POLICY "Agents can view company memberships"
ON public.company_memberships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.agent_company_assignments aca
    JOIN public.agents a ON a.id = aca.agent_id
    WHERE aca.company_id = company_memberships.company_id
      AND a.user_id = auth.uid()
      AND aca.status = 'active'
  )
);

DROP POLICY IF EXISTS "Agents can manage company memberships" ON public.company_memberships;
CREATE POLICY "Agents can manage company memberships"
ON public.company_memberships
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.agent_company_assignments aca
    JOIN public.agents a ON a.id = aca.agent_id
    WHERE aca.company_id = company_memberships.company_id
      AND a.user_id = auth.uid()
      AND aca.status = 'active'
  )
);
