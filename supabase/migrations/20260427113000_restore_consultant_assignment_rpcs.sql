BEGIN;

DROP FUNCTION IF EXISTS public.consultant_respond_ticket_assignment(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.consultant_send_ticket_to_uat(uuid, text, text[]);

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
  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found.';
  END IF;

  IF v_ticket.assigned_consultant_id IS NULL OR v_ticket.assigned_consultant_id <> auth.uid() THEN
    RAISE EXCEPTION 'This ticket is not assigned to you.';
  END IF;

  IF v_ticket.assignment_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'This assignment has already been answered.';
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
      COALESCE(NULLIF(btrim(p_note), ''), 'Consultant accepted and started work on this ticket.')
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
      COALESCE(NULLIF(btrim(p_note), ''), 'Consultant declined this assignment. Awaiting reassignment.')
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
  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

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
    uat_notes = COALESCE(NULLIF(btrim(p_note), ''), v_ticket.uat_notes),
    uat_attachments = COALESCE(p_attachments, v_ticket.uat_attachments),
    updated_at = now()
  WHERE id = p_ticket_id;

  INSERT INTO public.ticket_events (ticket_id, from_status, to_status, changed_by, note, attachments)
  VALUES (
    p_ticket_id,
    'in_progress',
    'uat',
    auth.uid(),
    COALESCE(NULLIF(btrim(p_note), ''), 'Consultant marked work complete and sent to UAT.'),
    p_attachments
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consultant_respond_ticket_assignment(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consultant_send_ticket_to_uat(uuid, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consultant_respond_ticket_assignment(uuid, boolean, text) TO anon;
GRANT EXECUTE ON FUNCTION public.consultant_send_ticket_to_uat(uuid, text, text[]) TO anon;

SELECT pg_notify('pgrst', 'reload schema');

COMMIT;

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'consultant_respond_ticket_assignment',
    'consultant_send_ticket_to_uat'
  )
ORDER BY p.proname;
