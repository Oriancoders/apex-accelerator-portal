BEGIN;

DROP FUNCTION IF EXISTS public.approve_ticket_with_credits(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.approve_ticket_with_credits(
  p_user_id uuid,
  p_ticket_id uuid,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_credit_cost numeric;
BEGIN
  SELECT COALESCE(credit_cost, 0)
  INTO v_ticket_credit_cost
  FROM public.tickets
  WHERE id = p_ticket_id;

  IF v_ticket_credit_cost <= 0 THEN
    RAISE EXCEPTION 'The approved credit amount is missing';
  END IF;

  RETURN public.approve_ticket_with_credits(
    p_user_id,
    v_ticket_credit_cost,
    p_ticket_id,
    p_description
  );
END;
$$;

GRANT USAGE ON SCHEMA public TO public;
GRANT EXECUTE ON FUNCTION public.approve_ticket_with_credits(uuid, uuid, text) TO public;

NOTIFY pgrst, 'reload schema';

COMMIT;
