BEGIN;

DROP POLICY IF EXISTS "Assigned consultants can insert events on assigned tickets" ON public.ticket_events;
CREATE POLICY "Assigned consultants can insert events on assigned tickets"
ON public.ticket_events
FOR INSERT
TO authenticated
WITH CHECK (
  changed_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = ticket_events.ticket_id
      AND t.assigned_consultant_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Assigned consultants can view client profiles on assigned tickets" ON public.profiles;
CREATE POLICY "Assigned consultants can view client profiles on assigned tickets"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.user_id = profiles.user_id
      AND t.assigned_consultant_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Assigned consultants can view companies on assigned tickets" ON public.companies;
CREATE POLICY "Assigned consultants can view companies on assigned tickets"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.company_id = companies.id
      AND t.assigned_consultant_id = auth.uid()
  )
);

COMMIT;
