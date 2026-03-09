
-- Create admin_adjust_credits function to atomically adjust credits (prevents race conditions)
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text DEFAULT 'Admin adjustment'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits integer;
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Atomic update with check
  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE user_id = p_user_id
    AND credits + p_amount >= 0
  RETURNING credits INTO new_credits;

  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits or user not found';
  END IF;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (
    p_user_id,
    p_amount,
    CASE WHEN p_amount > 0 THEN 'admin_credit' ELSE 'admin_debit' END,
    p_reason
  );

  RETURN new_credits;
END;
$$;
