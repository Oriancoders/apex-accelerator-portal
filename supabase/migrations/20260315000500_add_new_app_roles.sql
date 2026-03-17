-- Phase 1: add new app_role enum values.
-- Must run in its own migration/transaction before any SQL references these values.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'app_role'
      AND e.enumlabel = 'company_admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'company_admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'app_role'
      AND e.enumlabel = 'member'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'member';
  END IF;
END $$;