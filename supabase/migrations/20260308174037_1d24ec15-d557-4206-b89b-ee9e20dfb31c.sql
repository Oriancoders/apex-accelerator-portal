
-- Notifications table for admin alerts
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'signup', 'login', 'guest_session', 'new_ticket', 'ticket_status_change', 'proposal_submitted'
  title text NOT NULL,
  message text NOT NULL,
  user_id uuid, -- nullable for guest
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Chat messages table for per-ticket chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid, -- null for system messages
  sender_type text NOT NULL DEFAULT 'user', -- 'user', 'admin', 'system'
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat on own tickets" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = chat_messages.ticket_id AND tickets.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can send chat on own tickets" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = chat_messages.ticket_id AND tickets.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification (callable from client or triggers)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_type text,
  p_title text,
  p_message text,
  p_user_id uuid DEFAULT NULL,
  p_ticket_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, user_id, ticket_id)
  VALUES (p_type, p_title, p_message, p_user_id, p_ticket_id);
END;
$$;

-- Trigger: notify admin on new ticket
CREATE OR REPLACE FUNCTION public.notify_new_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_notification(
    'new_ticket',
    'New Ticket Submitted',
    'Ticket "' || NEW.title || '" has been submitted.',
    NEW.user_id,
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_ticket
  AFTER INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_ticket();

-- Trigger: notify admin on ticket status change
CREATE OR REPLACE FUNCTION public.notify_ticket_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.create_notification(
      'ticket_status_change',
      'Ticket Status Changed',
      'Ticket "' || NEW.title || '" changed from ' || OLD.status || ' to ' || NEW.status || '.',
      NEW.user_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_status_change();

-- Trigger: notify admin on new user signup
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_notification(
    'signup',
    'New User Signed Up',
    'User ' || COALESCE(NEW.full_name, NEW.email, 'Unknown') || ' has signed up.',
    NEW.user_id,
    NULL
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_user();
