
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  company TEXT,
  credits INTEGER NOT NULL DEFAULT 50,
  auth_provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup with 50 free credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Priority enum
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Status enum
CREATE TYPE public.ticket_status AS ENUM ('submitted', 'under_review', 'approved', 'in_progress', 'completed', 'cancelled');

-- Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'submitted',
  contact_email TEXT,
  contact_phone TEXT,
  file_urls TEXT[],
  expert_opinion TEXT,
  solution_roadmap JSONB,
  credit_cost INTEGER,
  estimated_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.tickets FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ticket updates/comments
CREATE TABLE public.ticket_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view updates on own tickets" ON public.ticket_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = ticket_updates.ticket_id AND tickets.user_id = auth.uid()) AND is_internal = false);
CREATE POLICY "Users can add updates to own tickets" ON public.ticket_updates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = ticket_updates.ticket_id AND tickets.user_id = auth.uid()));

CREATE INDEX idx_ticket_updates_ticket_id ON public.ticket_updates(ticket_id);

-- Credit transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'deduction', 'refund', 'bonus')),
  description TEXT,
  ticket_id UUID REFERENCES public.tickets(id),
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- Transactional credit deduction function
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id UUID, p_amount INTEGER, p_ticket_id UUID, p_description TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF current_credits >= p_amount THEN
    UPDATE public.profiles SET credits = credits - p_amount WHERE user_id = p_user_id;
    INSERT INTO public.credit_transactions (user_id, amount, type, description, ticket_id)
    VALUES (p_user_id, -p_amount, 'deduction', p_description, p_ticket_id);
    UPDATE public.tickets SET status = 'in_progress' WHERE id = p_ticket_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Articles / Knowledge Base
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('best_practice', 'recipe', 'quick_win', 'guide', 'news')),
  tags TEXT[],
  author TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published articles" ON public.articles FOR SELECT USING (published = true);

CREATE INDEX idx_articles_category ON public.articles(category);

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage for ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', false);

CREATE POLICY "Users can upload ticket attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own ticket attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
