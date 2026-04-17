import type { Database, Tables } from "@/integrations/supabase/types";

export type TicketType = Tables<"tickets">;
export type TicketEvent = Tables<"ticket_events">;
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export interface RoadmapItem {
  hour: number;
  title: string;
  description: string;
  complexity?: "easy" | "medium" | "hard" | "expert";
}

export const ALL_STATUSES: TicketStatus[] = [
  "submitted",
  "under_review",
  "approved",
  "in_progress",
  "uat",
  "completed",
  "cancelled",
];
