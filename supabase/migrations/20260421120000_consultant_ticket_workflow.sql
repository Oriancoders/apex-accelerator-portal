BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'app_role'
      AND e.enumlabel = 'consultant'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'consultant';
  END IF;
END $$;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS assigned_consultant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_status text CHECK (assignment_status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS consultant_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS consultant_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS uat_feedback text;

CREATE INDEX IF NOT EXISTS idx_tickets_assigned_consultant_id ON public.tickets(assigned_consultant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignment_status ON public.tickets(assignment_status);

CREATE OR REPLACE FUNCTION public.enforce_allowed_profile_roles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role NOT IN (
    'admin'::public.app_role,
    'company_admin'::public.app_role,
    'consultant'::public.app_role,
    'agent'::public.app_role,
    'member'::public.app_role
  ) THEN
    RAISE EXCEPTION 'Invalid role: %. Allowed roles are admin, company_admin, consultant, agent, member.', NEW.role;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Assigned consultants can view assigned tickets" ON public.tickets;
CREATE POLICY "Assigned consultants can view assigned tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (assigned_consultant_id = auth.uid());

DROP POLICY IF EXISTS "Assigned consultants can update assigned tickets" ON public.tickets;
CREATE POLICY "Assigned consultants can update assigned tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (assigned_consultant_id = auth.uid())
WITH CHECK (assigned_consultant_id = auth.uid());

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

    IF NEW.status = 'uat' AND OLD.status <> 'in_progress' THEN
      RAISE EXCEPTION 'Ticket can move to uat only from in_progress.';
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

DROP TRIGGER IF EXISTS trg_validate_consultant_ticket_flow ON public.tickets;
CREATE TRIGGER trg_validate_consultant_ticket_flow
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.validate_consultant_ticket_flow();

CREATE OR REPLACE FUNCTION public.assign_ticket_to_consultant(
  p_ticket_id uuid,
  p_consultant_user_id uuid,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admin can assign consultants.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_consultant_user_id
      AND ur.role IN ('consultant'::public.app_role, 'agent'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Target user is not a consultant.';
  END IF;

  SELECT * INTO v_ticket FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found.';
  END IF;

  UPDATE public.tickets
  SET
    assigned_consultant_id = p_consultant_user_id,
    assignment_status = 'pending',
    assigned_at = now(),
    consultant_accepted_at = NULL,
    consultant_completed_at = NULL,
    updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.ticket_events (ticket_id, from_status, to_status, changed_by, note)
  VALUES (
    p_ticket_id,
    v_ticket.status,
    v_ticket.status,
    auth.uid(),
    COALESCE(p_note, 'Admin assigned consultant to this ticket.')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consultant_respond_ticket_assignment(
  p_ticket_id uuid,
  p_accept boolean,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
  v_next_status public.ticket_status;
  v_next_assignment text;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found.';
  END IF;

  IF v_ticket.assigned_consultant_id IS NULL OR v_ticket.assigned_consultant_id <> auth.uid() THEN
    RAISE EXCEPTION 'This ticket is not assigned to you.';
  END IF;

  IF p_accept THEN
    v_next_assignment := 'accepted';
    v_next_status := CASE
      WHEN v_ticket.status IN ('approved', 'under_review', 'submitted') THEN 'in_progress'::public.ticket_status
      ELSE v_ticket.status
    END;

    UPDATE public.tickets
    SET
      assignment_status = v_next_assignment,
      consultant_accepted_at = now(),
      status = v_next_status,
      updated_at = now()
    WHERE id = p_ticket_id;

    INSERT INTO public.ticket_events (ticket_id, from_status, to_status, changed_by, note)
    VALUES (
      p_ticket_id,
      v_ticket.status,
      v_next_status,
      auth.uid(),
      COALESCE(p_note, 'Consultant accepted and started work on this ticket.')
    );
  ELSE
    v_next_assignment := 'rejected';
    v_next_status := 'approved'::public.ticket_status;

    UPDATE public.tickets
    SET
      assignment_status = v_next_assignment,
      status = v_next_status,
      updated_at = now()
    WHERE id = p_ticket_id;

    INSERT INTO public.ticket_events (ticket_id, from_status, to_status, changed_by, note)
    VALUES (
      p_ticket_id,
      v_ticket.status,
      v_next_status,
      auth.uid(),
      COALESCE(p_note, 'Consultant declined this assignment. Awaiting reassignment.')
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.consultant_send_ticket_to_uat(
  p_ticket_id uuid,
  p_note text DEFAULT NULL,
  p_attachments text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found.';
  END IF;

  IF v_ticket.assigned_consultant_id IS NULL OR v_ticket.assigned_consultant_id <> auth.uid() THEN
    RAISE EXCEPTION 'This ticket is not assigned to you.';
  END IF;

  IF v_ticket.assignment_status <> 'accepted' THEN
    RAISE EXCEPTION 'Assignment must be accepted before sending to UAT.';
  END IF;

  IF v_ticket.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Only in_progress tickets can be sent to UAT.';
  END IF;

  UPDATE public.tickets
  SET
    status = 'uat',
    consultant_completed_at = now(),
    uat_notes = COALESCE(p_note, v_ticket.uat_notes),
    uat_attachments = COALESCE(p_attachments, v_ticket.uat_attachments),
    updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.ticket_events (ticket_id, from_status, to_status, changed_by, note, attachments)
  VALUES (
    p_ticket_id,
    'in_progress',
    'uat',
    auth.uid(),
    COALESCE(p_note, 'Consultant marked work complete and sent to UAT.'),
    p_attachments
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_reopen_ticket_from_uat(
  p_ticket_id uuid,
  p_feedback text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found.';
  END IF;

  IF v_ticket.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only ticket owner can reopen from UAT.';
  END IF;

  IF v_ticket.status <> 'uat' THEN
    RAISE EXCEPTION 'Ticket must be in UAT to reopen.';
  END IF;

  IF COALESCE(trim(p_feedback), '') = '' THEN
    RAISE EXCEPTION 'Feedback is required to reopen the ticket.';
  END IF;

  UPDATE public.tickets
  SET
    status = 'in_progress',
    uat_feedback = p_feedback,
    updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.ticket_events (ticket_id, from_status, to_status, changed_by, note)
  VALUES (
    p_ticket_id,
    'uat',
    'in_progress',
    auth.uid(),
    'Client requested changes after UAT: ' || p_feedback
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_ticket_to_consultant(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consultant_respond_ticket_assignment(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consultant_send_ticket_to_uat(uuid, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_reopen_ticket_from_uat(uuid, text) TO authenticated;

COMMIT;
