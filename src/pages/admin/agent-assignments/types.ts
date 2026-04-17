import type { Tables } from "@/integrations/supabase/types";

export type CompanyRow = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
export type AgentRow = Pick<Tables<"agents">, "id" | "display_name" | "email" | "default_commission_percent" | "is_active">;
export type AssignmentRow = Tables<"agent_company_assignments">;
export type RuleRow = Tables<"commission_rules">;

export type PayoutModel = "percentage" | "flat";
