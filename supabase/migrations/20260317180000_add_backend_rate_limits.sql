-- Backend rate limiting primitives and ticket submission throttling.

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_key text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_api_rate_limits_key_window UNIQUE (rate_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_key_window
  ON public.api_rate_limits(rate_key, window_start DESC);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_requests integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
  v_allowed boolean;
  v_remaining integer;
  v_reset_at timestamptz;
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'Rate limit key is required';
  END IF;

  IF p_window_seconds <= 0 OR p_max_requests <= 0 THEN
    RAISE EXCEPTION 'Invalid rate limit window/max';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.api_rate_limits (rate_key, window_start, request_count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (rate_key, window_start)
  DO UPDATE
    SET request_count = public.api_rate_limits.request_count + 1,
        updated_at = now()
  RETURNING request_count INTO v_count;

  v_allowed := v_count <= p_max_requests;
  v_remaining := GREATEST(0, p_max_requests - v_count);
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  -- Lightweight cleanup to keep table bounded.
  DELETE FROM public.api_rate_limits
  WHERE updated_at < now() - interval '2 days';

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'reset_at', v_reset_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- Throttle ticket creation server-side as a safety net against abuse.
CREATE OR REPLACE FUNCTION public.enforce_ticket_submission_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.tickets
  WHERE user_id = NEW.user_id
    AND created_at >= now() - interval '1 minute';

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded for ticket submissions';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_ticket_submission_rate_limit ON public.tickets;
CREATE TRIGGER trg_enforce_ticket_submission_rate_limit
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.enforce_ticket_submission_rate_limit();

NOTIFY pgrst, 'reload schema';
