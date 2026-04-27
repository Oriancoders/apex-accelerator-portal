BEGIN;

-- Remove "company components" feature (module toggles).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'company_component_visibility'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.company_component_visibility';
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_company_component_visibility_updated_at ON public.company_component_visibility;

DROP TABLE IF EXISTS public.company_component_visibility CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;

