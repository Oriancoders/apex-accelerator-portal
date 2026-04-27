import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type MembershipRow = Tables<"company_memberships">;
export type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
export type AddMemberRole = "admin" | "member";
export type InsertMembership = TablesInsert<"company_memberships">;
