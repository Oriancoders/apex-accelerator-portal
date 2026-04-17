import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminUnreadCount() {
  return useQuery({
    queryKey: ["admin-unread-notifications"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      return count || 0;
    },
    refetchInterval: 15000,
  });
}
