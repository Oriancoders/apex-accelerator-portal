import { Building2, CreditCard, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyRow } from "@/pages/admin/company-members/types";
import type { CompanySubscription } from "@/lib/subscriptions";

type CompanySelectorCardProps = {
  companyId: string;
  companies: CompanyRow[];
  companiesLoading: boolean;
  selectedCompany: CompanyRow | null;
  selectedCompanyAgent: {
    id: string;
    commission_percent: number | null;
    status: string;
    agents?: { display_name: string | null; email: string | null; default_commission_percent: number } | null;
  } | null;
  selectedCompanySubscription: CompanySubscription | null;
  deleteCompanyPending: boolean;
  onCompanyChange: (value: string) => void;
  onDeleteCompany: (companyId: string) => void;
};

export default function CompanySelectorCard({
  companyId,
  companies,
  companiesLoading,
  selectedCompany,
  selectedCompanyAgent,
  selectedCompanySubscription,
  deleteCompanyPending,
  onCompanyChange,
  onDeleteCompany,
}: CompanySelectorCardProps) {
  const partnerName =
    selectedCompanyAgent?.agents?.display_name ||
    selectedCompanyAgent?.agents?.email ||
    "No active partner";
  const partnerCommission =
    selectedCompanyAgent?.commission_percent ??
    selectedCompanyAgent?.agents?.default_commission_percent ??
    null;

  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Select Company
        </CardTitle>
        <CardDescription>Choose a company to see access, partner, and subscription context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <select
          value={companyId}
          onChange={(e) => onCompanyChange(e.target.value)}
          className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
          disabled={companiesLoading}
        >
          <option value="">Select company...</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} ({company.slug})
            </option>
          ))}
        </select>

        {selectedCompany && (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3">
              <p className="text-[11px] uppercase text-muted-foreground font-semibold">Company</p>
              <p className="text-sm font-semibold text-foreground mt-1">{selectedCompany.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCompany.slug}</p>
            </div>
            <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Partner</p>
              </div>
              <p className="text-sm font-semibold text-foreground mt-1">{partnerName}</p>
              <p className="text-xs text-muted-foreground">
                {partnerCommission == null ? "No active assignment" : `${partnerCommission}% commission`}
              </p>
            </div>
            <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Subscription</p>
              </div>
              {selectedCompanySubscription ? (
                <>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedCompanySubscription.subscription_plans?.name || "Active plan"}
                    </p>
                    <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ends {new Date(selectedCompanySubscription.ends_at).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground mt-1">No subscription</p>
                  <p className="text-xs text-muted-foreground">Normal credit approval flow</p>
                </>
              )}
            </div>
          </div>
        )}

        {selectedCompany && (
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteCompanyPending}
              onClick={() => onDeleteCompany(selectedCompany.id)}
            >
              {deleteCompanyPending ? "Deleting..." : "Delete Company"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
