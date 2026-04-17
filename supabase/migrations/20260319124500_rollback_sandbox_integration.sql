BEGIN;

-- Remove triggers introduced by sandbox integration
DROP TRIGGER IF EXISTS enforce_sandbox_only ON public.sandbox_connections;
DROP TRIGGER IF EXISTS sandbox_connections_updated_at ON public.sandbox_connections;

-- Remove helper functions introduced by sandbox integration
DROP FUNCTION IF EXISTS public.check_sandbox_url();
DROP FUNCTION IF EXISTS public.update_updated_at();

-- Remove RLS policies introduced by sandbox integration
DROP POLICY IF EXISTS "client_own_connections" ON public.sandbox_connections;
DROP POLICY IF EXISTS "admin_assigned_connections" ON public.sandbox_connections;
DROP POLICY IF EXISTS "users_see_own_audit_logs" ON public.sandbox_audit_log;
DROP POLICY IF EXISTS "users_insert_own_audit_logs" ON public.sandbox_audit_log;

-- Drop sandbox tables (audit first due to FK dependencies)
DROP TABLE IF EXISTS public.sandbox_audit_log;
DROP TABLE IF EXISTS public.sandbox_connections;

-- Revert tickets category addition from sandbox migration
ALTER TABLE public.tickets
  DROP CONSTRAINT IF EXISTS tickets_category_check;

ALTER TABLE public.tickets
  DROP COLUMN IF EXISTS category;

COMMIT;
