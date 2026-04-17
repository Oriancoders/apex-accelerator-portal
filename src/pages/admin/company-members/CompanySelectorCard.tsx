import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyRow } from "@/pages/admin/company-members/types";

type CompanySelectorCardProps = {
  companyId: string;
  companies: CompanyRow[];
  companiesLoading: boolean;
  onCompanyChange: (value: string) => void;
};

export default function CompanySelectorCard({
  companyId,
  companies,
  companiesLoading,
  onCompanyChange,
}: CompanySelectorCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Select Company
        </CardTitle>
        <CardDescription>Choose the tenant company you want to manage.</CardDescription>
      </CardHeader>
      <CardContent>
        <select
          value={companyId}
          onChange={(e) => onCompanyChange(e.target.value)}
          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
          disabled={companiesLoading}
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
  );
}
