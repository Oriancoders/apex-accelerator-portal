import type { Tables } from "@/integrations/supabase/types";

export type MembershipRow = Tables<"company_memberships">;
export type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
export type AssignmentRow = Tables<"agent_company_assignments"> & {
  agents?: { display_name: string | null; email: string | null; default_commission_percent: number } | null;
};
export type AddMemberRole = "admin" | "member";
