
-- Add UAT and closed statuses to the ticket_status enum
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'uat' AFTER 'in_progress';
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'closed' AFTER 'completed';

-- Update notify_ticket_status_change to notify BOTH the ticket user AND all admins
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the ticket owner
    PERFORM public.create_notification(
      'ticket_status_change',
      'Ticket Status Changed',
      'Ticket "' || NEW.title || '" changed from ' || OLD.status || ' to ' || NEW.status || '.',
      NEW.user_id,
      NEW.id
    );
    -- Notify all admins
    FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin' AND user_id != NEW.user_id LOOP
      PERFORM public.create_notification(
        'ticket_status_change',
        'Ticket Status Changed',
        'Ticket "' || NEW.title || '" changed from ' || OLD.status || ' to ' || NEW.status || '.',
        admin_record.user_id,
        NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger for status changes (drop if exists, then create)
DROP TRIGGER IF EXISTS on_ticket_status_change ON public.tickets;
CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_status_change();

-- Also recreate trigger for new tickets to notify admins too
CREATE OR REPLACE FUNCTION public.notify_new_ticket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  -- Notify the ticket creator
  PERFORM public.create_notification(
    'new_ticket',
    'New Ticket Submitted',
    'Ticket "' || NEW.title || '" has been submitted.',
    NEW.user_id,
    NEW.id
  );
  -- Notify all admins
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin' AND user_id != NEW.user_id LOOP
    PERFORM public.create_notification(
      'new_ticket',
      'New Ticket Submitted',
      'Ticket "' || NEW.title || '" has been submitted.',
      admin_record.user_id,
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_new_ticket ON public.tickets;
CREATE TRIGGER on_new_ticket
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_ticket();

-- Create function to notify on credit purchase (both user and admins)
CREATE OR REPLACE FUNCTION public.notify_credit_purchase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
  user_name TEXT;
BEGIN
  IF NEW.type = 'purchase' AND NEW.amount > 0 THEN
    -- Get user name
    SELECT COALESCE(full_name, email, 'Unknown') INTO user_name FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Notify the buyer
    PERFORM public.create_notification(
      'credit_purchase',
      'Credits Purchased',
      'You purchased ' || NEW.amount || ' credits. ' || COALESCE(NEW.description, ''),
      NEW.user_id,
      NULL
    );
    -- Notify all admins
    FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin' AND user_id != NEW.user_id LOOP
      PERFORM public.create_notification(
        'credit_purchase',
        'Credit Purchase',
        user_name || ' purchased ' || NEW.amount || ' credits.',
        admin_record.user_id,
        NULL
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_credit_purchase ON public.credit_transactions;
CREATE TRIGGER on_credit_purchase
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_credit_purchase();
