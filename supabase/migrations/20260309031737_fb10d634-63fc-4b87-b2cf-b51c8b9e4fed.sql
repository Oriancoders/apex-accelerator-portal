
-- Allow users to insert ticket events for their own tickets (for approve/cancel actions)
CREATE POLICY "Users can insert events on own tickets" ON public.ticket_events FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND EXISTS (SELECT 1 FROM tickets WHERE tickets.id = ticket_events.ticket_id AND tickets.user_id = auth.uid())
  );
