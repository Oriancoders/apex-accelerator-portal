CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON public.ticket_events (ticket_id);