-- Trigger to ensuring tickets always have a company_id if possible

CREATE OR REPLACE FUNCTION public.ensure_ticket_company_id()
RETURNS TRIGGER AS $$
DECLARE
  found_company_id UUID;
BEGIN
  -- 1. Try to find the company from the user's PROFILE first (Primary Request)
  SELECT company_id INTO found_company_id
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- 2. If found in profile, assign it IF the ticket doesn't have one
  IF found_company_id IS NOT NULL THEN
    IF NEW.company_id IS NULL THEN
        NEW.company_id := found_company_id;
    END IF;
    RETURN NEW;
  END IF;

  -- 3. Fallback: Try to find the user's PRIMARY company from memberships
  IF NEW.company_id IS NULL THEN
      SELECT company_id INTO found_company_id
      FROM public.company_memberships
      WHERE user_id = NEW.user_id
      AND is_primary = true
      LIMIT 1;
      
      IF found_company_id IS NOT NULL THEN
        NEW.company_id := found_company_id;
        RETURN NEW;
      END IF;
  END IF;

  -- 4. Fallback: Pick ANY company membership
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO found_company_id
    FROM public.company_memberships
    WHERE user_id = NEW.user_id
    LIMIT 1;

    IF found_company_id IS NOT NULL THEN
        NEW.company_id := found_company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS tr_ensure_ticket_company_id ON public.tickets;

-- Create the trigger
CREATE TRIGGER tr_ensure_ticket_company_id
BEFORE INSERT ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.ensure_ticket_company_id();
