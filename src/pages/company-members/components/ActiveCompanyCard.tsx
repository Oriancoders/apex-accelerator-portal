import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface ActiveCompanyCardProps {
  name: string;
  slug: string;
}

export function ActiveCompanyCard({ name, slug }: ActiveCompanyCardProps) {
  return (
    <Card className="rounded-ds-xl border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Active Company
        </CardTitle>
        <CardDescription>{name} ({slug})</CardDescription>
      </CardHeader>
    </Card>
  );
}
