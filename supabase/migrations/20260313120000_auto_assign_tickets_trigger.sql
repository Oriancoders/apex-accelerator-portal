-- Trigger to automatically assign/unassign tickets when company membership changes

CREATE OR REPLACE FUNCTION public.handle_membership_ticket_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- On Join: Adopt orphaned tickets (tickets with no company_id) created by this user
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.tickets
    SET company_id = NEW.company_id
    WHERE user_id = NEW.user_id
    AND company_id IS NULL;
    RETURN NEW;
  
  -- On Leave: Release tickets that belong to this company back to the user (set company_id to NULL)
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.tickets
    SET company_id = NULL
    WHERE user_id = OLD.user_id
    AND company_id = OLD.company_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow idempotency
DROP TRIGGER IF EXISTS on_membership_change_tickets ON public.company_memberships;

CREATE TRIGGER on_membership_change_tickets
AFTER INSERT OR DELETE ON public.company_memberships
FOR EACH ROW EXECUTE FUNCTION public.handle_membership_ticket_updates();
