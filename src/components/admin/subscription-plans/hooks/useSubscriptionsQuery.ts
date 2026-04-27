import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ActiveSubscription } from "../types";

export function useSubscriptionsQuery() {
  return useQuery({
    queryKey: ["admin-company-subscriptions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_subscriptions")
        .select("*, companies(name, slug), subscription_plans(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ActiveSubscription[];
    },
  });
}
