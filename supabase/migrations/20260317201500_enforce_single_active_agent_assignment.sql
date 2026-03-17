-- Enforce one active agent assignment per company-agent pair.
-- This prevents duplicate active links and keeps trigger inserts predictable.

-- 1) Close duplicate active rows, keep the newest active row per pair.
WITH ranked AS (
  SELECT
    id,
    company_id,
    agent_id,
    row_number() OVER (
      PARTITION BY company_id, agent_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.agent_company_assignments
  WHERE status = 'active'
)
UPDATE public.agent_company_assignments aca
SET
  status = 'ended',
  effective_to = COALESCE(aca.effective_to, now()),
  notes = COALESCE(aca.notes || ' | ', '') || 'Auto-ended duplicate active assignment during integrity migration'
FROM ranked r
WHERE aca.id = r.id
  AND r.rn > 1;

-- 2) Add partial unique index for active assignments.
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_company_active_assignment
  ON public.agent_company_assignments(company_id, agent_id)
  WHERE status = 'active';

NOTIFY pgrst, 'reload schema';
