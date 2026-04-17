BEGIN;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tickets_category_check'
      AND conrelid = 'public.tickets'::regclass
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_category_check
      CHECK (category IN ('general', 'salesforce'));
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.sandbox_connections') IS NULL THEN
    CREATE TABLE IF NOT EXISTS public.sandbox_connections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      sf_org_id text,
      sf_instance_url text NOT NULL,
      sf_org_type text NOT NULL DEFAULT 'sandbox',
      access_token text NOT NULL,
      refresh_token text NOT NULL,
      token_expires_at timestamptz,
      sf_user_id text,
      sf_user_email text,
      sf_display_name text,
      is_active boolean NOT NULL DEFAULT true,
      revoked_at timestamptz,
      revoked_by uuid REFERENCES auth.users(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT sandbox_connections_ticket_id_key UNIQUE (ticket_id)
    );
  ELSE
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS ticket_id uuid;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS user_id uuid;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS sf_org_id text;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS sf_instance_url text;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS sf_org_type text NOT NULL DEFAULT 'sandbox';
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS access_token text;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS refresh_token text;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS sf_user_id text;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS sf_user_email text;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS sf_display_name text;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS revoked_by uuid;
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
    ALTER TABLE public.sandbox_connections ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'sandbox_connections_ticket_id_key'
    ) THEN
      ALTER TABLE public.sandbox_connections
        ADD CONSTRAINT sandbox_connections_ticket_id_key UNIQUE (ticket_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'sandbox_connections_ticket_id_fkey'
    ) THEN
      ALTER TABLE public.sandbox_connections
        ADD CONSTRAINT sandbox_connections_ticket_id_fkey
        FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'sandbox_connections_user_id_fkey'
    ) THEN
      ALTER TABLE public.sandbox_connections
        ADD CONSTRAINT sandbox_connections_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'sandbox_connections_revoked_by_fkey'
    ) THEN
      ALTER TABLE public.sandbox_connections
        ADD CONSTRAINT sandbox_connections_revoked_by_fkey
        FOREIGN KEY (revoked_by) REFERENCES auth.users(id);
    END IF;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.sandbox_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.sandbox_connections(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  performed_by text NOT NULL,
  sf_api_endpoint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_connections_ticket_id ON public.sandbox_connections(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_connections_user_id ON public.sandbox_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_connections_active ON public.sandbox_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_sandbox_audit_ticket_id ON public.sandbox_audit_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_audit_connection_id ON public.sandbox_audit_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_audit_created_at ON public.sandbox_audit_log(created_at DESC);

ALTER TABLE public.sandbox_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_own_connections" ON public.sandbox_connections;
CREATE POLICY "client_own_connections"
ON public.sandbox_connections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_assigned_connections" ON public.sandbox_connections;
CREATE POLICY "admin_assigned_connections"
ON public.sandbox_connections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = sandbox_connections.ticket_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_company_assigned_agent(auth.uid(), t.company_id)
      )
  )
);

DROP POLICY IF EXISTS "users_see_own_audit_logs" ON public.sandbox_audit_log;
CREATE POLICY "users_see_own_audit_logs"
ON public.sandbox_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sandbox_connections sc
    WHERE sc.id = sandbox_audit_log.connection_id
      AND (
        sc.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR EXISTS (
          SELECT 1
          FROM public.tickets t
          WHERE t.id = sc.ticket_id
            AND public.is_company_assigned_agent(auth.uid(), t.company_id)
        )
      )
  )
);

DROP POLICY IF EXISTS "users_insert_own_audit_logs" ON public.sandbox_audit_log;
CREATE POLICY "users_insert_own_audit_logs"
ON public.sandbox_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sandbox_connections sc
    WHERE sc.id = sandbox_audit_log.connection_id
      AND (
        sc.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

CREATE OR REPLACE FUNCTION public.check_sandbox_url()
RETURNS trigger AS $$
BEGIN
  IF NEW.sf_instance_url IS NULL THEN
    RAISE EXCEPTION 'Salesforce instance URL is required.';
  END IF;

  IF NEW.sf_instance_url ILIKE '%login.salesforce.com%'
     OR NEW.sf_instance_url ILIKE 'https://na%.salesforce.com%'
     OR NEW.sf_instance_url ILIKE 'https://eu%.salesforce.com%'
     OR NEW.sf_instance_url ILIKE 'https://ap%.salesforce.com%'
  THEN
    RAISE EXCEPTION 'Production Salesforce orgs are not allowed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_sandbox_only ON public.sandbox_connections;
CREATE TRIGGER enforce_sandbox_only
BEFORE INSERT OR UPDATE ON public.sandbox_connections
FOR EACH ROW EXECUTE FUNCTION public.check_sandbox_url();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sandbox_connections_updated_at ON public.sandbox_connections;
CREATE TRIGGER sandbox_connections_updated_at
BEFORE UPDATE ON public.sandbox_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;
