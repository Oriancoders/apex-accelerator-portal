
-- =====================================================
-- FIX 1: Convert ALL RESTRICTIVE RLS policies to PERMISSIVE
-- =====================================================

-- ARTICLES
DROP POLICY IF EXISTS "Admins can manage articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can read published articles" ON public.articles;
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read published articles" ON public.articles FOR SELECT TO authenticated USING (published = true);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "Users can send chat on own tickets" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view chat on own tickets" ON public.chat_messages;
CREATE POLICY "Users can view chat on own tickets" ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = chat_messages.ticket_id AND tickets.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Users can send chat on own tickets" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM tickets WHERE tickets.id = chat_messages.ticket_id AND tickets.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- CONTACT_SUBMISSIONS
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Admins can manage submissions" ON public.contact_submissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

-- CREDIT_SETTINGS
DROP POLICY IF EXISTS "Admins can manage settings" ON public.credit_settings;
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.credit_settings;
CREATE POLICY "Admins can manage settings" ON public.credit_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read settings" ON public.credit_settings FOR SELECT TO authenticated USING (true);

-- CREDIT_TRANSACTIONS
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert transactions" ON public.credit_transactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- EXTENSIONS
DROP POLICY IF EXISTS "Admins can manage extensions" ON public.extensions;
DROP POLICY IF EXISTS "Anyone can read published extensions" ON public.extensions;
CREATE POLICY "Admins can manage extensions" ON public.extensions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read published extensions" ON public.extensions FOR SELECT TO authenticated USING (published = true);

-- NEWS_ITEMS
DROP POLICY IF EXISTS "Admins can manage news" ON public.news_items;
DROP POLICY IF EXISTS "Anyone can read published news" ON public.news_items;
CREATE POLICY "Admins can manage news" ON public.news_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read published news" ON public.news_items FOR SELECT TO authenticated USING (published = true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update notifications" ON public.notifications FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- PROFILES
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- TICKET_EVENTS
DROP POLICY IF EXISTS "Admins can insert ticket events" ON public.ticket_events;
DROP POLICY IF EXISTS "Users can insert events on own tickets" ON public.ticket_events;
DROP POLICY IF EXISTS "Users can view events on own tickets" ON public.ticket_events;
CREATE POLICY "Users can view events on own tickets" ON public.ticket_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_events.ticket_id AND tickets.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "Users can insert events on own tickets" ON public.ticket_events FOR INSERT TO authenticated WITH CHECK (
  changed_by = auth.uid()
  AND EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_events.ticket_id AND tickets.user_id = auth.uid())
);
CREATE POLICY "Admins can insert ticket events" ON public.ticket_events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- TICKET_REVIEWS
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.ticket_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.ticket_reviews;
CREATE POLICY "Users can insert own reviews" ON public.ticket_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reviews" ON public.ticket_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- TICKET_UPDATES
DROP POLICY IF EXISTS "Admins can insert ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Admins can view all ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can add updates to own tickets" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can view updates on own tickets" ON public.ticket_updates;
CREATE POLICY "Users can view updates on own tickets" ON public.ticket_updates FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_updates.ticket_id AND tickets.user_id = auth.uid()) AND is_internal = false
);
CREATE POLICY "Admins can view all ticket updates" ON public.ticket_updates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can add updates to own tickets" ON public.ticket_updates FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_updates.ticket_id AND tickets.user_id = auth.uid())
);
CREATE POLICY "Admins can insert ticket updates" ON public.ticket_updates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- TICKETS
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all tickets" ON public.tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 2: Harden add_purchase_credits - restrict to service_role only
-- =====================================================
CREATE OR REPLACE FUNCTION public.add_purchase_credits(p_user_id uuid, p_amount integer, p_description text, p_stripe_session_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits integer;
  calling_role text;
BEGIN
  -- SECURITY: Only allow service_role (edge functions) to call this
  calling_role := current_setting('request.jwt.claim.role', true);
  IF calling_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: only internal services can add purchase credits';
  END IF;

  -- Check for duplicate
  IF EXISTS (SELECT 1 FROM credit_transactions WHERE stripe_session_id = p_stripe_session_id) THEN
    SELECT credits INTO new_credits FROM profiles WHERE user_id = p_user_id;
    RETURN new_credits;
  END IF;

  -- Atomic credit update
  UPDATE profiles
  SET credits = credits + p_amount
  WHERE user_id = p_user_id
  RETURNING credits INTO new_credits;

  IF new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO credit_transactions (user_id, amount, type, description, stripe_session_id)
  VALUES (p_user_id, p_amount, 'purchase', p_description, p_stripe_session_id);

  RETURN new_credits;
END;
$$;

-- =====================================================
-- FIX 3: Harden deduct_credits - enforce caller = target user
-- =====================================================
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer, p_ticket_id uuid, p_description text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- SECURITY: Caller must be the user whose credits are being deducted
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only deduct own credits';
  END IF;

  -- Verify the ticket belongs to the caller
  IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = p_ticket_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: ticket does not belong to user';
  END IF;

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
$$;
