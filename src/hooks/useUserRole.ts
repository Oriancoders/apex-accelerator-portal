import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PortalRole = "admin" | "company_admin" | "agent" | "member" | "moderator" | "user";

export function useUserRole() {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return (data?.role as PortalRole | undefined) ?? null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return { role, isLoading };
}
