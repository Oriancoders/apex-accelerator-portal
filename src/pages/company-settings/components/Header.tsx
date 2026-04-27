import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  companyName: string;
  companySlug: string;
  companyStatus: string;
  membershipsCount: number;
}

export function Header({ companyName, companySlug, companyStatus, membershipsCount }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {companyName}
          </h1>
          <Badge variant={companyStatus === "active" ? "default" : "secondary"} className="capitalize">
            {companyStatus}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          tenant/{companySlug}
        </p>
        {membershipsCount > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            {membershipsCount} companies — use the navbar switcher to change active company
          </p>
        )}
      </div>
    </div>
  );
}
