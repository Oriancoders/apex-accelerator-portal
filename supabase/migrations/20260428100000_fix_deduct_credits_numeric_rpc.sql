BEGIN;

DROP FUNCTION IF EXISTS public.deduct_credits(uuid, integer, uuid, text);
DROP FUNCTION IF EXISTS public.deduct_credits(uuid, numeric, uuid, text);

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount numeric,
  p_ticket_id uuid,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits numeric;
  v_ticket_user_id uuid;
  v_ticket_status public.ticket_status;
  v_ticket_credit_cost numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only deduct own credits';
  END IF;

  SELECT user_id, status, COALESCE(credit_cost, 0)
  INTO v_ticket_user_id, v_ticket_status, v_ticket_credit_cost
  FROM public.tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF v_ticket_user_id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF v_ticket_user_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: ticket does not belong to user';
  END IF;

  IF v_ticket_status <> 'under_review'::public.ticket_status THEN
    RAISE EXCEPTION 'Ticket is not awaiting proposal approval';
  END IF;

  IF p_amount <> v_ticket_credit_cost THEN
    RAISE EXCEPTION 'Credit amount does not match the approved proposal';
  END IF;

  SELECT credits
  INTO v_current_credits
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_current_credits < v_ticket_credit_cost THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET credits = credits - v_ticket_credit_cost
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, ticket_id)
  VALUES (p_user_id, -v_ticket_credit_cost, 'deduction', p_description, p_ticket_id);

  UPDATE public.tickets
  SET status = 'approved',
      updated_at = now()
  WHERE id = p_ticket_id;

  RETURN TRUE;
END;
$$;

-- Keep the legacy integer signature so older RPC payloads still resolve after the decimal migration.
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_ticket_id uuid,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.deduct_credits(
    p_user_id,
    p_amount::numeric,
    p_ticket_id,
    p_description
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
