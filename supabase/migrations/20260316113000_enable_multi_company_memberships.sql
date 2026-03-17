-- Ensure one user can belong to multiple companies.
-- Keep only pair-uniqueness (company_id, user_id), not global uniqueness on user_id.

DO $$
DECLARE
  idx record;
BEGIN
  -- Drop accidental unique indexes that enforce one-company-per-user on company_memberships(user_id).
  FOR idx IN
    SELECT i.indexname
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
      AND i.tablename = 'company_memberships'
      AND i.indexdef ILIKE 'CREATE UNIQUE INDEX% (user_id)%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', idx.indexname);
  END LOOP;
END $$;

-- Ensure the intended uniqueness: same user cannot be inserted twice in the same company.
ALTER TABLE public.company_memberships
  DROP CONSTRAINT IF EXISTS company_memberships_company_id_user_id_key;

ALTER TABLE public.company_memberships
  ADD CONSTRAINT company_memberships_company_id_user_id_key UNIQUE (company_id, user_id);

-- Optional safety: only one primary company per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_memberships_one_primary_per_user
ON public.company_memberships(user_id)
WHERE is_primary = true;
