BEGIN;

-- Trigger: Auto-create consultant role when assigned_consultant_id is set
CREATE OR REPLACE FUNCTION public.ensure_consultant_role_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only proceed if a consultant was newly assigned
  IF NEW.assigned_consultant_id IS NOT NULL
     AND (OLD.assigned_consultant_id IS NULL OR OLD.assigned_consultant_id != NEW.assigned_consultant_id) THEN

    -- Check if the consultant already has the consultant role
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = NEW.assigned_consultant_id
      AND role = 'consultant'::app_role
    ) THEN
      -- If no consultant role exists, create it
      INSERT INTO user_roles (user_id, role)
      VALUES (NEW.assigned_consultant_id, 'consultant'::app_role)
      ON CONFLICT (user_id) DO UPDATE
      SET role = 'consultant'::app_role;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists first
DROP TRIGGER IF EXISTS tickets_ensure_consultant_role ON public.tickets;

-- Create the trigger on INSERT and UPDATE
CREATE TRIGGER tickets_ensure_consultant_role
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.ensure_consultant_role_on_assignment();

-- Also manually ensure any existing consultants who are assigned to tickets have the role
DO $$
DECLARE
  consultant_id UUID;
BEGIN
  FOR consultant_id IN
    SELECT DISTINCT assigned_consultant_id
    FROM public.tickets
    WHERE assigned_consultant_id IS NOT NULL
  LOOP
    INSERT INTO user_roles (user_id, role)
    VALUES (consultant_id, 'consultant'::app_role)
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'consultant'::app_role;
  END LOOP;
END $$;

COMMIT;
