-- Credit withdrawal requests flow:
-- 1) user/agent submits request with payout account details
-- 2) admin manually pays outside system
-- 3) admin marks request paid, system deducts credits atomically

CREATE TABLE IF NOT EXISTS public.credit_withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_credits numeric(10,2) NOT NULL CHECK (requested_credits > 0),
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  account_details text NOT NULL,
  requester_note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
  admin_notes text,
  payout_reference text,
  credit_transaction_id uuid REFERENCES public.credit_transactions(id) ON DELETE SET NULL,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_withdrawal_requests_user_id
  ON public.credit_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_withdrawal_requests_status
  ON public.credit_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_credit_withdrawal_requests_created_at
  ON public.credit_withdrawal_requests(created_at DESC);

ALTER TABLE public.credit_withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.credit_withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests"
ON public.credit_withdrawal_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON public.credit_withdrawal_requests;
CREATE POLICY "Users can create own withdrawal requests"
ON public.credit_withdrawal_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

DROP POLICY IF EXISTS "Users can cancel pending withdrawal requests" ON public.credit_withdrawal_requests;
CREATE POLICY "Users can cancel pending withdrawal requests"
ON public.credit_withdrawal_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'cancelled')
);

DROP POLICY IF EXISTS "Admins can manage withdrawal requests" ON public.credit_withdrawal_requests;
CREATE POLICY "Admins can manage withdrawal requests"
ON public.credit_withdrawal_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_credit_withdrawal_requests_updated_at ON public.credit_withdrawal_requests;
CREATE TRIGGER update_credit_withdrawal_requests_updated_at
BEFORE UPDATE ON public.credit_withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.admin_mark_withdrawal_paid(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL,
  p_payout_reference text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.credit_withdrawal_requests%ROWTYPE;
  v_tx_id uuid;
  v_remaining_credits numeric(10,2);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  SELECT *
  INTO v_req
  FROM public.credit_withdrawal_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF v_req.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Only pending/approved requests can be marked paid';
  END IF;

  UPDATE public.profiles
  SET credits = credits - v_req.requested_credits
  WHERE user_id = v_req.user_id
    AND credits >= v_req.requested_credits
  RETURNING credits INTO v_remaining_credits;

  IF v_remaining_credits IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits for this withdrawal request';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (
    v_req.user_id,
    -v_req.requested_credits,
    'deduction',
    COALESCE(
      p_admin_notes,
      'Withdrawal paid manually by admin. Ref: ' || COALESCE(p_payout_reference, 'N/A')
    )
  )
  RETURNING id INTO v_tx_id;

  UPDATE public.credit_withdrawal_requests
  SET
    status = 'paid',
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    payout_reference = COALESCE(p_payout_reference, payout_reference),
    credit_transaction_id = v_tx_id,
    processed_by = auth.uid(),
    processed_at = now()
  WHERE id = p_request_id;

  RETURN v_tx_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_mark_withdrawal_paid(uuid, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
