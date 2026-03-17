-- Remove practical usage of 'closed' ticket status.
-- Keep enum compatibility but normalize all records to 'completed'
-- and block future writes that try to set status='closed'.

-- 1) Normalize existing rows.
UPDATE public.tickets
SET status = 'completed'
WHERE status = 'closed';

UPDATE public.ticket_events
SET to_status = 'completed'
WHERE to_status = 'closed';

UPDATE public.ticket_events
SET from_status = 'completed'
WHERE from_status = 'closed';

-- 2) Block future use of closed status in app writes.
CREATE OR REPLACE FUNCTION public.prevent_closed_ticket_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'closed'::public.ticket_status THEN
    RAISE EXCEPTION 'Ticket status "closed" is deprecated. Use "completed".';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_closed_ticket_status ON public.tickets;
CREATE TRIGGER trg_prevent_closed_ticket_status
BEFORE INSERT OR UPDATE OF status ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.prevent_closed_ticket_status();
