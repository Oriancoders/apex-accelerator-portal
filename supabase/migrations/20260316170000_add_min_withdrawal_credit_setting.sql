-- Add configurable minimum credits required to submit a withdrawal request.
INSERT INTO public.credit_settings (key, value)
VALUES ('min_withdrawal_credits', '10')
ON CONFLICT (key) DO NOTHING;
