
-- Trigger: notify on new profile (user signup)
CREATE TRIGGER on_new_profile_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user();

-- Trigger: notify on new ticket
CREATE TRIGGER on_new_ticket_notify
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_ticket();

-- Trigger: notify on ticket status change
CREATE TRIGGER on_ticket_status_change_notify
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_status_change();
