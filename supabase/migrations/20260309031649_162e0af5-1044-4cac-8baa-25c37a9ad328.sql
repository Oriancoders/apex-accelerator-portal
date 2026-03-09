
-- FIX CRITICAL: Convert all RESTRICTIVE RLS policies to PERMISSIVE
-- RESTRICTIVE policies AND together, breaking multi-policy access

-- ===== ARTICLES =====
DROP POLICY IF EXISTS "Admins can manage articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can read published articles" ON public.articles;
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read published articles" ON public.articles FOR SELECT TO anon, authenticated USING (published = true);

-- ===== CHAT MESSAGES =====
DROP POLICY IF EXISTS "Users can view chat on own tickets" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send chat on own tickets" ON public.chat_messages;
CREATE POLICY "Users can view chat on own tickets" ON public.chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = chat_messages.ticket_id AND tickets.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can send chat on own tickets" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) AND (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = chat_messages.ticket_id AND tickets.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

-- ===== CONTACT SUBMISSIONS =====
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view submissions" ON public.contact_submissions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update submissions" ON public.contact_submissions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete submissions" ON public.contact_submissions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== CREDIT SETTINGS =====
DROP POLICY IF EXISTS "Admins can manage settings" ON public.credit_settings;
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.credit_settings;
CREATE POLICY "Admins can manage settings" ON public.credit_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read settings" ON public.credit_settings FOR SELECT TO authenticated USING (true);

-- ===== CREDIT TRANSACTIONS =====
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Admins can insert transactions" ON public.credit_transactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== EXTENSIONS =====
DROP POLICY IF EXISTS "Admins can manage extensions" ON public.extensions;
DROP POLICY IF EXISTS "Anyone can read published extensions" ON public.extensions;
CREATE POLICY "Admins can manage extensions" ON public.extensions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read published extensions" ON public.extensions FOR SELECT TO anon, authenticated USING (published = true);

-- ===== NEWS ITEMS =====
DROP POLICY IF EXISTS "Admins can manage news" ON public.news_items;
DROP POLICY IF EXISTS "Anyone can read published news" ON public.news_items;
CREATE POLICY "Admins can manage news" ON public.news_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read published news" ON public.news_items FOR SELECT TO anon, authenticated USING (published = true);

-- ===== NOTIFICATIONS =====
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can update notifications" ON public.notifications FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== PROFILES =====
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== TICKET EVENTS =====
DROP POLICY IF EXISTS "Admins can insert ticket events" ON public.ticket_events;
DROP POLICY IF EXISTS "Users can view events on own tickets" ON public.ticket_events;
CREATE POLICY "Admins can insert ticket events" ON public.ticket_events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view events on own tickets" ON public.ticket_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_events.ticket_id AND tickets.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- ===== TICKET REVIEWS =====
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.ticket_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.ticket_reviews;
CREATE POLICY "Users can insert own reviews" ON public.ticket_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reviews" ON public.ticket_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- ===== TICKET UPDATES =====
DROP POLICY IF EXISTS "Admins can insert ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Admins can view all ticket updates" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can add updates to own tickets" ON public.ticket_updates;
DROP POLICY IF EXISTS "Users can view updates on own tickets" ON public.ticket_updates;
CREATE POLICY "Admins can insert ticket updates" ON public.ticket_updates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all ticket updates" ON public.ticket_updates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can add updates to own tickets" ON public.ticket_updates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_updates.ticket_id AND tickets.user_id = auth.uid()));
CREATE POLICY "Users can view updates on own tickets" ON public.ticket_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_updates.ticket_id AND tickets.user_id = auth.uid()) AND is_internal = false);

-- ===== TICKETS =====
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Admins can update all tickets" ON public.tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== USER ROLES =====
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
