-- Settings table for credit pricing config
CREATE TABLE public.credit_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read/write
CREATE POLICY "Admins can manage settings" ON public.credit_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can read settings (needed for pricing display)
CREATE POLICY "Authenticated can read settings" ON public.credit_settings
  FOR SELECT TO authenticated
  USING (true);

-- Seed default values
INSERT INTO public.credit_settings (key, value) VALUES
  ('dollar_per_credit', '"2.50"'),
  ('priority_rates', '{"low": 10, "medium": 15, "high": 20, "critical": 30}'),
  ('difficulty_rates', '{"easy": 10, "medium": 15, "hard": 20, "expert": 30}');
