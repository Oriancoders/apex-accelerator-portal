import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import type { CompanyRow, VisibilityRow } from "@/pages/admin/company-components/types";

export function useAdminCompanyComponentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [companyId, setCompanyId] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, status")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as CompanyRow[];
    },
  });

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === companyId) || null,
    [companies, companyId]
  );

  const { data: visibilityRows = [], isLoading: visibilityLoading } = useQuery({
    queryKey: ["admin-company-component-visibility", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_component_visibility")
        .select("id, company_id, component_key, is_enabled, config, updated_by, created_at, updated_at")
        .eq("company_id", companyId);

      if (error) throw error;
      return (data || []) as VisibilityRow[];
    },
    enabled: !!companyId,
  });

  const visibilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    visibilityRows.forEach((row) => {
      map[row.component_key] = row.is_enabled;
    });
    return map;
  }, [visibilityRows]);

  const toggleMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      if (!companyId) throw new Error("Please select a company first");

      const payload: TablesInsert<"company_component_visibility"> = {
        company_id: companyId,
        component_key: key,
        is_enabled: enabled,
        updated_by: user?.id || null,
      };

      const { error } = await supabase
        .from("company_component_visibility")
        .upsert(payload, { onConflict: "company_id,component_key" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company-component-visibility", companyId] });
    },
    onError: () => {
      toast.error("Operation failed. Please try again.");
    },
  });

  return {
    companyId,
    setCompanyId,
    companies,
    selectedCompany,
    visibilityMap,
    visibilityLoading,
    toggleMutation,
  };
}
