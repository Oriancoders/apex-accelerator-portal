BEGIN;

CREATE OR REPLACE FUNCTION public.validate_consultant_ticket_flow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'in_progress' AND OLD.status = 'approved' THEN
      IF NEW.assigned_consultant_id IS NULL OR NEW.assignment_status <> 'accepted' THEN
        RAISE EXCEPTION 'Ticket cannot move to in_progress without consultant acceptance.';
      END IF;
    END IF;

    IF NEW.status = 'uat' THEN
      IF OLD.status <> 'in_progress' THEN
        RAISE EXCEPTION 'Ticket can move to uat only from in_progress.';
      END IF;

      IF OLD.assigned_consultant_id IS NULL OR auth.uid() <> OLD.assigned_consultant_id THEN
        RAISE EXCEPTION 'Only the assigned consultant can send this ticket to UAT.';
      END IF;

      IF COALESCE(OLD.assignment_status, '') <> 'accepted' THEN
        RAISE EXCEPTION 'Consultant assignment must be accepted before UAT handoff.';
      END IF;
    END IF;

    IF NEW.status = 'completed' AND OLD.status = 'uat' THEN
      IF auth.uid() <> OLD.user_id AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
        RAISE EXCEPTION 'Only the ticket owner can complete this ticket from UAT.';
      END IF;
    END IF;

    IF NEW.status = 'in_progress' AND OLD.status = 'uat' THEN
      IF COALESCE(NEW.uat_feedback, '') = '' THEN
        RAISE EXCEPTION 'Please provide UAT feedback before reopening.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Assigned consultants can view events on assigned tickets" ON public.ticket_events;
CREATE POLICY "Assigned consultants can view events on assigned tickets"
ON public.ticket_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = ticket_events.ticket_id
      AND t.assigned_consultant_id = auth.uid()
  )
);

COMMIT;
