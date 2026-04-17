export type NotificationItem = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  ticket_id: string | null;
  is_read: boolean;
  created_at: string;
};
