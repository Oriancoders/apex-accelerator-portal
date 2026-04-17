import type { Database } from "@/integrations/supabase/types";

export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export type TicketChatProps = {
  ticketId: string;
  isAdmin?: boolean;
};
