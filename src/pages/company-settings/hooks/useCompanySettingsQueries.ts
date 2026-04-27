import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveSubscription, fetchActiveSubscriptionPlans } from "@/lib/subscriptions";
import type { MembershipRow, ProfileRow, AssignmentRow } from "../types";

export function useActiveSubscription(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-active-subscription", companyId],
    queryFn: () => fetchActiveSubscription(companyId!),
    enabled: !!companyId,
  });
}

export function useSubscriptionPlans(enabled: boolean) {
  return useQuery({
    queryKey: ["active-subscription-plans"],
    queryFn: fetchActiveSubscriptionPlans,
    enabled,
  });
}

export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-dash-members", companyId],
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
    queryKey: ["company-dash-profiles"],
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

export function useCompanyTickets(memberUserIds: string[]) {
  return useQuery({
    queryKey: ["company-dash-tickets", memberUserIds],
    queryFn: async () => {
      if (!memberUserIds.length) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select("id, user_id, status, credit_cost, created_at, title, priority")
        .in("user_id", memberUserIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: memberUserIds.length > 0,
  });
}

export function useAgentAssignments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-dash-agent-assignments", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select("*, agents:agent_id(display_name, email, default_commission_percent)")
        .eq("company_id", companyId)
        .eq("status", "active");
      if (error) throw error;
      return (data || []) as AssignmentRow[];
    },
    enabled: !!companyId,
  });
}
