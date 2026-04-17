import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type AppRole = "admin" | "company_admin" | "agent" | "member";

export type UserCompanyMembershipRow = {
  user_id: string;
  is_primary: boolean;
  companies: { name: string } | null;
};

export const ROLE_PRIORITY: Record<string, number> = {
  admin: 1,
  company_admin: 2,
  agent: 3,
  member: 4,
};

export const ASSIGNABLE_ROLES: AppRole[] = ["admin", "company_admin", "agent", "member"];
