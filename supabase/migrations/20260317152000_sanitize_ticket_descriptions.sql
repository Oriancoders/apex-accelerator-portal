-- Sanitize ticket descriptions at database level to reduce stored XSS risk
-- even when data is inserted/updated through direct REST API calls.

CREATE OR REPLACE FUNCTION public.sanitize_ticket_description_input()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.description IS NULL THEN
    RETURN NEW;
  END IF;

  -- Remove script/iframe/object/embed blocks.
  NEW.description := regexp_replace(NEW.description, '<\s*script[^>]*>.*?<\s*/\s*script\s*>', '', 'gis');
  NEW.description := regexp_replace(NEW.description, '<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>', '', 'gis');
  NEW.description := regexp_replace(NEW.description, '<\s*object[^>]*>.*?<\s*/\s*object\s*>', '', 'gis');
  NEW.description := regexp_replace(NEW.description, '<\s*embed[^>]*>', '', 'gis');

  -- Remove inline event handlers.
  NEW.description := regexp_replace(NEW.description, '\son[a-zA-Z]+\s*=\s*"[^"]*"', '', 'gis');
  NEW.description := regexp_replace(NEW.description, '\son[a-zA-Z]+\s*=\s*''[^'']*''', '', 'gis');
  NEW.description := regexp_replace(NEW.description, '\son[a-zA-Z]+\s*=\s*[^\s>]+', '', 'gis');

  -- Neutralize risky URI schemes.
  NEW.description := regexp_replace(NEW.description, 'javascript\s*:', '', 'gi');
  NEW.description := regexp_replace(NEW.description, 'data\s*:\s*text/html', '', 'gi');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sanitize_ticket_description_input ON public.tickets;
CREATE TRIGGER trg_sanitize_ticket_description_input
BEFORE INSERT OR UPDATE OF description ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_ticket_description_input();

NOTIFY pgrst, 'reload schema';
