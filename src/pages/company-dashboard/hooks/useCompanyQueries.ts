import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Company, CompanyMembership, AssignedAgent } from "../types";
import { fetchActiveSubscription } from "@/lib/subscriptions";

export function useCompanyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["company-by-slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, status")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!slug,
    retry: false,
  });
}

export function useCompanyMembership(companyId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["my-membership", companyId, userId],
    queryFn: async () => {
      if (!companyId || !userId) return null;
      const { data, error } = await supabase
        .from("company_memberships")
        .select("role")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as CompanyMembership | null;
    },
    enabled: !!companyId && !!userId,
  });
}

export function useAssignedAgent(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-agent", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select(`
          agents (
            display_name,
            email
          )
        `)
        .eq("company_id", companyId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error fetching agent:", error);
        return null;
      }
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCompanyActiveSubscription(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-active-subscription", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      return fetchActiveSubscription(companyId);
    },
    enabled: !!companyId,
  });
}
