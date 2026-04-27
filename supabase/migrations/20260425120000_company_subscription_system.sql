BEGIN;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_credits integer NOT NULL CHECK (price_credits >= 0),
  duration_days integer NOT NULL DEFAULT 30 CHECK (duration_days > 0),
  partner_commission_percent numeric(5,2) NOT NULL DEFAULT 10 CHECK (partner_commission_percent >= 0 AND partner_commission_percent <= 100),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  purchased_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  purchased_credit_transaction_id uuid REFERENCES public.credit_transactions(id) ON DELETE SET NULL,
  partner_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  partner_commission_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (partner_commission_percent >= 0 AND partner_commission_percent <= 100),
  partner_commission_credits integer NOT NULL DEFAULT 0 CHECK (partner_commission_credits >= 0),
  partner_commission_transaction_id uuid REFERENCES public.credit_transactions(id) ON DELETE SET NULL,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_subscriptions_one_active
  ON public.company_subscriptions(company_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id
  ON public.company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status
  ON public.company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_partner_agent_id
  ON public.company_subscriptions(partner_agent_id);

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_subscriptions_updated_at ON public.company_subscriptions;
CREATE TRIGGER update_company_subscriptions_updated_at
BEFORE UPDATE ON public.company_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Authenticated users can view active subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Company members can view company subscriptions" ON public.company_subscriptions;
CREATE POLICY "Company members can view company subscriptions"
ON public.company_subscriptions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.company_id = company_subscriptions.company_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.agent_company_assignments aca
    JOIN public.agents a ON a.id = aca.agent_id
    WHERE aca.company_id = company_subscriptions.company_id
      AND aca.status = 'active'
      AND a.user_id = auth.uid()
      AND a.is_active = true
  )
);

DROP POLICY IF EXISTS "Admins can manage company subscriptions" ON public.company_subscriptions;
CREATE POLICY "Admins can manage company subscriptions"
ON public.company_subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.subscription_plans (
  name,
  slug,
  description,
  price_credits,
  duration_days,
  partner_commission_percent,
  is_default,
  is_active
)
VALUES (
  'Managed Delivery',
  'managed-delivery',
  'Monthly company subscription. Tickets skip client credit approval and go directly to admin assignment.',
  500,
  30,
  10,
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.has_active_company_subscription(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_subscriptions cs
    WHERE cs.company_id = p_company_id
      AND cs.status = 'active'
      AND cs.starts_at <= now()
      AND cs.ends_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.purchase_company_subscription(
  p_company_id uuid,
  p_plan_id uuid
)
RETURNS public.company_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.subscription_plans%ROWTYPE;
  v_current_credits integer;
  v_purchase_tx_id uuid;
  v_partner_agent_id uuid;
  v_partner_user_id uuid;
  v_partner_percent numeric(5,2) := 0;
  v_partner_commission integer := 0;
  v_partner_tx_id uuid;
  v_subscription public.company_subscriptions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = p_company_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'billing')
    )
  ) THEN
    RAISE EXCEPTION 'Only a company owner, admin, billing member, or platform admin can buy a subscription.';
  END IF;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = p_plan_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription plan not found or inactive.';
  END IF;

  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF COALESCE(v_current_credits, 0) < v_plan.price_credits THEN
    RAISE EXCEPTION 'Insufficient credits for this subscription.';
  END IF;

  UPDATE public.profiles
  SET credits = credits - v_plan.price_credits
  WHERE user_id = auth.uid();

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (
    auth.uid(),
    -v_plan.price_credits,
    'deduction',
    'Subscription purchase: ' || v_plan.name
  )
  RETURNING id INTO v_purchase_tx_id;

  SELECT
    aca.agent_id,
    a.user_id,
    COALESCE(aca.commission_percent, a.default_commission_percent, v_plan.partner_commission_percent) AS commission_percent
  INTO v_partner_agent_id, v_partner_user_id, v_partner_percent
  FROM public.agent_company_assignments aca
  JOIN public.agents a ON a.id = aca.agent_id
  WHERE aca.company_id = p_company_id
    AND aca.status = 'active'
    AND a.is_active = true
  ORDER BY aca.created_at ASC
  LIMIT 1;

  IF v_partner_user_id IS NOT NULL THEN
    v_partner_percent := COALESCE(v_partner_percent, v_plan.partner_commission_percent, 0);
    v_partner_commission := ROUND(v_plan.price_credits * (v_partner_percent / 100.0))::integer;

    IF v_partner_commission > 0 THEN
      UPDATE public.profiles
      SET credits = credits + v_partner_commission
      WHERE user_id = v_partner_user_id;

      INSERT INTO public.credit_transactions (user_id, amount, type, description)
      VALUES (
        v_partner_user_id,
        v_partner_commission,
        'bonus',
        'Partner subscription commission for company ' || p_company_id::text || ': ' || v_plan.name
      )
      RETURNING id INTO v_partner_tx_id;
    END IF;
  END IF;

  UPDATE public.company_subscriptions
  SET status = 'cancelled',
      updated_at = now()
  WHERE company_id = p_company_id
    AND status = 'active';

  INSERT INTO public.company_subscriptions (
    company_id,
    plan_id,
    status,
    starts_at,
    ends_at,
    purchased_by,
    purchased_credit_transaction_id,
    partner_agent_id,
    partner_commission_percent,
    partner_commission_credits,
    partner_commission_transaction_id
  )
  VALUES (
    p_company_id,
    p_plan_id,
    'active',
    now(),
    now() + make_interval(days => v_plan.duration_days),
    auth.uid(),
    v_purchase_tx_id,
    v_partner_agent_id,
    COALESCE(v_partner_percent, 0),
    COALESCE(v_partner_commission, 0),
    v_partner_tx_id
  )
  RETURNING * INTO v_subscription;

  RETURN v_subscription;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_subscription_ticket_flow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NOT NULL AND public.has_active_company_subscription(NEW.company_id) THEN
    NEW.status := 'approved'::public.ticket_status;
    NEW.credit_cost := 0;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_subscription_ticket_flow ON public.tickets;
CREATE TRIGGER trg_apply_subscription_ticket_flow
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.apply_subscription_ticket_flow();

REVOKE EXECUTE ON FUNCTION public.purchase_company_subscription(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_company_subscription(uuid, uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.has_active_company_subscription(uuid) TO authenticated;

COMMIT;
