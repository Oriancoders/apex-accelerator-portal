import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfileCompanySlug(userId: string | undefined, shouldFetch: boolean) {
  return useQuery({
    queryKey: ["profile-company-slug", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        // @ts-ignore - company_id exists in DB, generated types may lag
        .select("company_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) return null;
      // @ts-ignore
      const companyId = profileRow?.company_id as string | undefined;
      if (!companyId) return null;

      const { data: companyRow, error: companyError } = await supabase
        .from("companies")
        .select("slug")
        .eq("id", companyId)
        .maybeSingle();

      if (companyError) return null;
      return companyRow?.slug || null;
    },
    enabled: shouldFetch && !!userId,
    staleTime: 60_000,
  });
}
