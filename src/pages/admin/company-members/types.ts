import type { Tables } from "@/integrations/supabase/types";

export type CompanyRow = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
export type MembershipRow = Tables<"company_memberships">;
export type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;

export const ADD_MEMBER_ROLES = ["admin", "member"] as const;
export type AddMemberRole = (typeof ADD_MEMBER_ROLES)[number];
