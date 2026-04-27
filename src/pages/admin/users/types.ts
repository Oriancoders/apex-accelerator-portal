import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type AppRole = "admin" | "company_admin" | "agent" | "consultant" | "member";

export type UserCompanyMembershipRow = {
  user_id: string;
  is_primary: boolean;
  companies: { name: string } | null;
};

export const ROLE_PRIORITY: Record<string, number> = {
  admin: 1,
  company_admin: 2,
  consultant: 3,
  agent: 4,
  member: 5,
};

export const ASSIGNABLE_ROLES: AppRole[] = ["admin", "company_admin", "consultant", "agent", "member"];
