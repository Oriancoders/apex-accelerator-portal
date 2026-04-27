import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionPlan } from "../types";

export function usePlansQuery() {
  return useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subscription_plans")
        .select("*")
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SubscriptionPlan[];
    },
  });
}
