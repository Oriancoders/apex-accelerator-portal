import type { Tables } from "@/integrations/supabase/types";

export type ConsultantTicket = Pick<
  Tables<"tickets">,
  | "id"
  | "user_id"
  | "company_id"
  | "status"
  | "credit_cost"
  | "created_at"
  | "title"
  | "description"
  | "file_urls"
  | "priority"
  | "assigned_consultant_id"
  | "assignment_status"
>;

export type CompanyRow = Pick<Tables<"companies">, "id" | "name" | "slug">;
export type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
export type TicketEventRow = Pick<Tables<"ticket_events">, "id" | "ticket_id" | "from_status" | "to_status" | "note" | "created_at">;
export type TicketDetailRow = Tables<"tickets">;
