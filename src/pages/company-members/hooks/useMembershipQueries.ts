import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MembershipRow, ProfileRow } from "../types";

export function useCompanyMemberships(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-memberships-manage", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_memberships")
        .select("id, company_id, user_id, role, is_primary, invited_by, created_at, updated_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MembershipRow[];
    },
    enabled: !!companyId,
  });
}

export function useAllProfiles(enabled: boolean) {
  return useQuery({
    queryKey: ["company-members-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
    enabled,
  });
}
