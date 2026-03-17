-- Allow company members to view their assigned agent details

-- 1. Helper function: Check if current user is a member of a company assigned to the target agent
CREATE OR REPLACE FUNCTION public.can_view_agent(_user_id uuid, _agent_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.agent_company_assignments aca
    JOIN public.company_memberships cm ON cm.company_id = aca.company_id
    WHERE aca.agent_id = _agent_id
      AND cm.user_id = _user_id
      AND aca.status = 'active'
  );
$$;

-- 2. Update AGENTS table policy
-- Allow reading agent profile if they are your assigned agent
CREATE POLICY "Company members can view assigned agent"
ON public.agents
FOR SELECT
TO authenticated
USING (public.can_view_agent(auth.uid(), id));


-- 3. Update AGENT_COMPANY_ASSIGNMENTS table policy
-- Allow any company member (not just admins/managers) to see who is assigned
DROP POLICY IF EXISTS "Assignment visibility" ON public.agent_company_assignments;

CREATE POLICY "Assignment visibility"
ON public.agent_company_assignments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_company_member(auth.uid(), company_id)
  OR EXISTS (
    SELECT 1
    FROM public.agents a
    WHERE a.id = agent_id AND a.user_id = auth.uid()
  )
);
