import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveSubscription } from "@/lib/subscriptions";

export function useActiveSubscription(companyId: string) {
  return useQuery({
    queryKey: ["company-active-subscription", companyId],
    queryFn: () => fetchActiveSubscription(companyId),
    enabled: !!companyId,
  });
}
