BEGIN;

CREATE OR REPLACE FUNCTION public.apply_subscription_ticket_flow()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT p.company_id
    INTO v_company_id
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id;

    IF v_company_id IS NULL THEN
      SELECT cm.company_id
      INTO v_company_id
      FROM public.company_memberships cm
      WHERE cm.user_id = NEW.user_id
      ORDER BY cm.is_primary DESC, cm.created_at ASC
      LIMIT 1;
    END IF;

    NEW.company_id := v_company_id;
  END IF;

  IF NEW.company_id IS NOT NULL
     AND (
       public.has_role(NEW.user_id, 'admin'::public.app_role)
       OR public.is_company_member(NEW.user_id, NEW.company_id)
     )
     AND public.has_active_company_subscription(NEW.company_id) THEN
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

COMMIT;
