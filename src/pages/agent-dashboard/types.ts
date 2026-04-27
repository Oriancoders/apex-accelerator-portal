import type { Tables } from "@/integrations/supabase/types";
import type { CompanySubscription } from "@/lib/subscriptions";

export type AgentCompanyAssignment = Tables<"agent_company_assignments"> & {
  companies?: Pick<Tables<"companies">, "name" | "slug"> | Pick<Tables<"companies">, "name" | "slug">[] | null;
};

export type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
export type TicketEventRow = Pick<Tables<"ticket_events">, "id" | "ticket_id" | "from_status" | "to_status" | "note" | "created_at">;
export type TicketDetailRow = Tables<"tickets">;

export interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
}

export interface StatsData {
  tickets: number;
  openTickets: number;
  creditsConsumed: number;
  earned: number;
  potential: number;
}

export interface PeriodStat {
  total: number;
  resolved: number;
  creditsConsumed: number;
  earned: number;
  openCount: number;
  potential: number;
}

export interface ConsultantTicket extends TicketDetailRow {
  assigned_consultant_id?: string;
  assignment_status?: string;
}
