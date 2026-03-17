import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type AgentRow = Tables<"agents">;
type MembershipRow = Tables<"company_memberships"> & {
  companies?: Tables<"companies"> | null;
};
type ComponentVisibilityRow = Tables<"company_component_visibility">;

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

  const { data: componentVisibility = [], isLoading: componentLoading } = useQuery({
    queryKey: ["company-component-visibility", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany?.id) return [];
      const { data, error } = await supabase
        .from("company_component_visibility")
        .select("component_key, is_enabled")
        .eq("company_id", activeCompany.id);
      if (error) throw error;
      return (data || []) as ComponentVisibilityRow[];
    },
    enabled: !!activeCompany?.id,
    staleTime: 30_000,
  });

  const visibilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    componentVisibility.forEach((row) => {
      map[row.component_key] = row.is_enabled;
    });
    return map;
  }, [componentVisibility]);

  const isAgent = !!agent?.is_active;

  const isLoading = agentLoading || membershipsLoading || componentLoading;

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
