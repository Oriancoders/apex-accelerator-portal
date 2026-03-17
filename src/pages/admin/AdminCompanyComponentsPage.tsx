import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LayoutGrid, Building2 } from "lucide-react";

const COMPONENT_KEYS = [
  "ticket_submission",
  "ticket_overview",
  "knowledge_base",
  "recipes",
  "appexchange",
  "news",
  "extensions",
] as const;

type CompanyRow = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
type VisibilityRow = Tables<"company_component_visibility">;

function labelFromKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminCompanyComponentsPage() {
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
    () => companies.find((c) => c.id === companyId) || null,
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
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Company Component Toggles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control general vs company-specific dashboard modules for each tenant.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Select Company
            </CardTitle>
            <CardDescription>Choose a tenant company and configure visible components.</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Select company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.slug})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedCompany && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                {selectedCompany.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>Component visibility settings</span>
                <Badge variant="outline" className="text-[11px]">{selectedCompany.status}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMPONENT_KEYS.map((key) => {
                const isEnabled = visibilityMap[key] ?? true;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-3"
                  >
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{labelFromKey(key)}</Label>
                      <p className="text-xs text-muted-foreground">Key: {key}</p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      disabled={toggleMutation.isPending || visibilityLoading}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ key, enabled: checked })
                      }
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
