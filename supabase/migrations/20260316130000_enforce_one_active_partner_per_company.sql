-- Enforce: one company can have only one active partner (agent assignment) at a time.
-- Historical rows remain allowed (paused/ended), and one agent can still manage multiple companies.

-- 1) Clean existing violations by ending older active assignments per company.
WITH ranked AS (
  SELECT
    id,
    company_id,
    ROW_NUMBER() OVER (
      PARTITION BY company_id
      ORDER BY effective_from DESC, created_at DESC, id DESC
    ) AS rn
  FROM public.agent_company_assignments
  WHERE status = 'active'
)
UPDATE public.agent_company_assignments aca
SET
  status = 'ended',
  effective_to = COALESCE(aca.effective_to, now()),
  notes = COALESCE(aca.notes, '') || CASE WHEN COALESCE(aca.notes, '') = '' THEN '' ELSE E'\n' END || 'Auto-ended by migration: one active partner per company enforcement.'
FROM ranked r
WHERE aca.id = r.id
  AND r.rn > 1;

-- 2) Hard constraint: only one active assignment per company.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_partner_per_company
ON public.agent_company_assignments(company_id)
WHERE status = 'active';
