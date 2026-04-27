BEGIN;

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
DECLARE
  current_credits integer;
BEGIN
  -- Caller can only deduct own credits.
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only deduct own credits';
  END IF;

  -- Ticket must belong to caller.
  IF NOT EXISTS (
    SELECT 1
    FROM public.tickets
    WHERE id = p_ticket_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: ticket does not belong to user';
  END IF;

  SELECT credits
  INTO current_credits
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, ticket_id)
  VALUES (p_user_id, -p_amount, 'deduction', p_description, p_ticket_id);

  -- Payment approval should not start delivery automatically.
  UPDATE public.tickets
  SET status = 'approved',
      updated_at = now()
  WHERE id = p_ticket_id
    AND status = 'under_review';

  RETURN TRUE;
END;
$$;

COMMIT;
