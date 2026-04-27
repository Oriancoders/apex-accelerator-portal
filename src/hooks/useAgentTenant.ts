import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type AgentRow = Tables<"agents">;
type MembershipRow = Tables<"company_memberships"> & {
  companies?: Tables<"companies"> | null;
};

export function useAgentTenant() {
  const { user } = useAuth();

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["agent-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("agents")
        .select("id, user_id, display_name, email, default_commission_percent, is_active")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data || null) as AgentRow | null;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ["company-memberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("company_memberships")
        .select("company_id, role, is_primary, companies:company_id(id, name, slug, status)")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return (data || []) as MembershipRow[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const activeMembership = useMemo(() => {
    if (!memberships.length) return null;
    return memberships.find((m) => m.is_primary) || memberships[0];
  }, [memberships]);

  const activeCompany = activeMembership?.companies || null;
  const visibilityMap = useMemo(() => ({} as Record<string, boolean>), []);

  const isAgent = !!agent?.is_active;

  const isLoading = agentLoading || membershipsLoading;

  return {
    isLoading,
    isAgent,
    agent,
    memberships,
    activeMembership,
    activeCompany,
    visibilityMap,
  };
}
