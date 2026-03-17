-- Helper functions for brute-force lock checks without incrementing counters.

CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
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
  v_count integer := 0;
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

  SELECT request_count INTO v_count
  FROM public.api_rate_limits
  WHERE rate_key = p_key
    AND window_start = v_window_start;

  v_count := COALESCE(v_count, 0);
  v_allowed := v_count < p_max_requests;
  v_remaining := GREATEST(0, p_max_requests - v_count);
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', v_remaining,
    'reset_at', v_reset_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rate_limit_status(text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.clear_rate_limit_key(p_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'Rate limit key is required';
  END IF;

  DELETE FROM public.api_rate_limits
  WHERE rate_key = p_key;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_rate_limit_key(text) TO service_role;

NOTIFY pgrst, 'reload schema';
