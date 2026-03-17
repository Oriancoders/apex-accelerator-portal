-- Multi-tenant foundation: agents, companies, memberships, assignments, commission rules
-- This migration is designed to support:
-- 1) Admin registers agents
-- 2) Agent creates company/account
-- 3) Company-specific access and feature/component visibility

-- Add agent to app_role enum when missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'app_role'
      AND e.enumlabel = 'agent'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'agent';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Core entities
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  default_commission_percent numeric(5,2) NOT NULL DEFAULT 15.00 CHECK (
    default_commission_percent >= 0 AND default_commission_percent <= 100
  ),
  is_active boolean NOT NULL DEFAULT true,
  onboarded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'archived')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_via_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'billing')),
  is_primary boolean NOT NULL DEFAULT false,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.agent_company_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  commission_percent numeric(5,2) CHECK (commission_percent >= 0 AND commission_percent <= 100),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to > effective_from),
  UNIQUE (company_id, agent_id, effective_from)
);

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global', 'agent', 'company', 'assignment')),
  rule_name text NOT NULL DEFAULT 'default',
  payout_model text NOT NULL DEFAULT 'percentage' CHECK (payout_model IN ('percentage', 'flat')),
  commission_percent numeric(5,2),
  flat_amount numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  applies_to text[] NOT NULL DEFAULT ARRAY['all']::text[],
  priority smallint NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES public.agent_company_assignments(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz,
  CHECK (effective_to IS NULL OR effective_to > effective_from),
  CHECK (
    (payout_model = 'percentage' AND commission_percent IS NOT NULL AND commission_percent >= 0 AND commission_percent <= 100)
    OR
    (payout_model = 'flat' AND flat_amount IS NOT NULL AND flat_amount >= 0)
  ),
  CHECK (
    (scope = 'global' AND agent_id IS NULL AND company_id IS NULL AND assignment_id IS NULL)
    OR
    (scope = 'agent' AND agent_id IS NOT NULL AND company_id IS NULL AND assignment_id IS NULL)
    OR
    (scope = 'company' AND company_id IS NOT NULL AND agent_id IS NULL AND assignment_id IS NULL)
    OR
    (scope = 'assignment' AND assignment_id IS NOT NULL)
  )
);

-- Company-specific component toggles (general components + tenant-specific components)
CREATE TABLE IF NOT EXISTS public.company_component_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  component_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, component_key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON public.agents(is_active);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_created_via_agent_id ON public.companies(created_via_agent_id);

CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON public.company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_user_id ON public.company_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_role ON public.company_memberships(role);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_company_id ON public.agent_company_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON public.agent_company_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON public.agent_company_assignments(status);

CREATE INDEX IF NOT EXISTS idx_commission_rules_scope ON public.commission_rules(scope);
CREATE INDEX IF NOT EXISTS idx_commission_rules_agent_id ON public.commission_rules(agent_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_company_id ON public.commission_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_assignment_id ON public.commission_rules(assignment_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_active_priority ON public.commission_rules(is_active, priority);

CREATE INDEX IF NOT EXISTS idx_company_component_visibility_company_id
  ON public.company_component_visibility(company_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_company_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark the first membership as primary; later companies remain non-primary by default.
  INSERT INTO public.company_memberships (company_id, user_id, role, is_primary, invited_by)
  VALUES (
    NEW.id,
    NEW.created_by,
    'owner',
    NOT EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.user_id = NEW.created_by
    ),
    NEW.created_by
  )
  ON CONFLICT (company_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_company_created_add_owner ON public.companies;
CREATE TRIGGER on_company_created_add_owner
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_new_company_membership();

DROP TRIGGER IF EXISTS update_company_memberships_updated_at ON public.company_memberships;
CREATE TRIGGER update_company_memberships_updated_at
BEFORE UPDATE ON public.company_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_company_assignments_updated_at ON public.agent_company_assignments;
CREATE TRIGGER update_agent_company_assignments_updated_at
BEFORE UPDATE ON public.agent_company_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_commission_rules_updated_at ON public.commission_rules;
CREATE TRIGGER update_commission_rules_updated_at
BEFORE UPDATE ON public.commission_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_component_visibility_updated_at ON public.company_component_visibility;
CREATE TRIGGER update_company_component_visibility_updated_at
BEFORE UPDATE ON public.company_component_visibility
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions for tenant-aware RLS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_agent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agents a
    WHERE a.user_id = _user_id
      AND a.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = _user_id
      AND cm.company_id = _company_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id uuid, _company_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = _user_id
      AND cm.company_id = _company_id
      AND cm.role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.has_role(_user_id, 'admin'::public.app_role)
    OR public.has_company_role(_user_id, _company_id, 'owner')
    OR public.has_company_role(_user_id, _company_id, 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_assigned_agent(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agent_company_assignments aca
    JOIN public.agents a ON a.id = aca.agent_id
    WHERE a.user_id = _user_id
      AND a.is_active = true
      AND aca.company_id = _company_id
      AND aca.status = 'active'
      AND (aca.effective_to IS NULL OR aca.effective_to > now())
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_company_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_component_visibility ENABLE ROW LEVEL SECURITY;

-- AGENTS
CREATE POLICY "Admins can manage agents"
ON public.agents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Agents can view own profile"
ON public.agents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- COMPANIES
CREATE POLICY "Admins can manage companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Members and assigned agents can read companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  public.is_company_member(auth.uid(), id)
  OR public.is_company_assigned_agent(auth.uid(), id)
);

CREATE POLICY "Agents can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_agent(auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Company managers can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (public.can_manage_company(auth.uid(), id))
WITH CHECK (public.can_manage_company(auth.uid(), id));

-- COMPANY_MEMBERSHIPS
CREATE POLICY "Membership visibility"
ON public.company_memberships
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
  OR public.is_company_assigned_agent(auth.uid(), company_id)
);

CREATE POLICY "Admins and company managers can insert memberships"
ON public.company_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
  OR (
    public.is_agent(auth.uid())
    AND public.is_company_assigned_agent(auth.uid(), company_id)
  )
);

CREATE POLICY "Admins and company managers can update memberships"
ON public.company_memberships
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
);

CREATE POLICY "Admins and company managers can delete memberships"
ON public.company_memberships
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
);

-- AGENT_COMPANY_ASSIGNMENTS
CREATE POLICY "Assignment visibility"
ON public.agent_company_assignments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
  OR EXISTS (
    SELECT 1
    FROM public.agents a
    WHERE a.id = agent_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and company managers can manage assignments"
ON public.agent_company_assignments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
);

-- COMMISSION_RULES
CREATE POLICY "Commission rule visibility"
ON public.commission_rules
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    company_id IS NOT NULL
    AND (
      public.is_company_member(auth.uid(), company_id)
      OR public.is_company_assigned_agent(auth.uid(), company_id)
    )
  )
  OR (
    agent_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.agents a
      WHERE a.id = agent_id
        AND a.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can manage global commission rules"
ON public.commission_rules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Company managers can manage company and assignment rules"
ON public.commission_rules
FOR ALL
TO authenticated
USING (
  (
    company_id IS NOT NULL
    AND public.can_manage_company(auth.uid(), company_id)
  )
  OR (
    assignment_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.agent_company_assignments aca
      WHERE aca.id = assignment_id
        AND public.can_manage_company(auth.uid(), aca.company_id)
    )
  )
)
WITH CHECK (
  (
    company_id IS NOT NULL
    AND public.can_manage_company(auth.uid(), company_id)
  )
  OR (
    assignment_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.agent_company_assignments aca
      WHERE aca.id = assignment_id
        AND public.can_manage_company(auth.uid(), aca.company_id)
    )
  )
);

-- COMPANY_COMPONENT_VISIBILITY
CREATE POLICY "Component visibility is tenant-scoped"
ON public.company_component_visibility
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.is_company_member(auth.uid(), company_id)
  OR public.is_company_assigned_agent(auth.uid(), company_id)
);

CREATE POLICY "Company managers can manage component visibility"
ON public.company_component_visibility
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.can_manage_company(auth.uid(), company_id)
);

-- Keep realtime optional for tenant operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'company_component_visibility'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.company_component_visibility;
  END IF;
END $$;
