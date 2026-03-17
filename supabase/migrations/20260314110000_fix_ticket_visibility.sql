-- Fix Ticket Visibility for Agents and Company Admins
-- Previously, RLS only allowed users to see their OWN tickets.
-- This policy allows Agents and Company Admins to see tickets belonging to companies they manage.

-- 1. Create Policy for Agents/Managers
DROP POLICY IF EXISTS "Agents and Managers can view company tickets" ON public.tickets;

CREATE POLICY "Agents and Managers can view company tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL AND (
    -- Check if user is Company Owner/Admin
    public.can_manage_company(auth.uid(), company_id) 
    OR 
    -- Check if user is the Assigned Agent
    public.is_company_assigned_agent(auth.uid(), company_id)
  )
);

-- 2. Optional: Allow them to UPDATE tickets as well (e.g. change status)
DROP POLICY IF EXISTS "Agents and Managers can update company tickets" ON public.tickets;

CREATE POLICY "Agents and Managers can update company tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
  company_id IS NOT NULL AND (
    public.can_manage_company(auth.uid(), company_id) 
    OR 
    public.is_company_assigned_agent(auth.uid(), company_id)
  )
);
