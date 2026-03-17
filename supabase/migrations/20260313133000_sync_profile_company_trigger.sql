-- Trigger to sync company_memberships changes to public.profiles.company_id

CREATE OR REPLACE FUNCTION public.sync_profile_company_id()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user joins a company, set their profile's company_id to that company
  -- (Last joined company becomes the active one in profile)
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles
    SET company_id = NEW.company_id
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  
  -- If a user marks a membership as primary, update profile to match
  ELSIF (TG_OP = 'UPDATE' AND NEW.is_primary = true) THEN
    UPDATE public.profiles
    SET company_id = NEW.company_id
    WHERE user_id = NEW.user_id;
    RETURN NEW;

  -- When a user leaves a company
  ELSIF (TG_OP = 'DELETE') THEN
    -- Only clear profile company_id if it was set to the company they are leaving
    UPDATE public.profiles
    SET company_id = NULL
    WHERE user_id = OLD.user_id AND company_id = OLD.company_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent errors
DROP TRIGGER IF EXISTS on_membership_sync_profile ON public.company_memberships;

-- Create the trigger
CREATE TRIGGER on_membership_sync_profile
AFTER INSERT OR DELETE OR UPDATE OF is_primary ON public.company_memberships
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_company_id();
