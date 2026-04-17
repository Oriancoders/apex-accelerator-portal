import type { Database } from "@/integrations/supabase/types";

export type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export type TicketStage = {
  key: Exclude<TicketStatus, "cancelled">;
  label: string;
};
