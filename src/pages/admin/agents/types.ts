import type { Tables } from "@/integrations/supabase/types";

export type AgentRow = Tables<"agents">;
export type ProfileLite = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
export type CompanyLite = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
export type AssignmentLite = Tables<"agent_company_assignments"> & {
  companies?: Pick<Tables<"companies">, "name" | "slug"> | null;
};
