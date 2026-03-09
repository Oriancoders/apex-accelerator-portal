CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);