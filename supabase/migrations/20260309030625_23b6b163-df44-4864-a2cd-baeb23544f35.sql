
-- Ensure the trigger for ticket inserts exists
DROP TRIGGER IF EXISTS on_ticket_insert_resend ON public.tickets;
CREATE TRIGGER on_ticket_insert_resend
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.invoke_resend_webhook();

-- Ensure the trigger for ticket updates exists  
DROP TRIGGER IF EXISTS on_ticket_update_resend ON public.tickets;
CREATE TRIGGER on_ticket_update_resend
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.invoke_resend_webhook();
