import { LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { COMPONENT_KEYS, labelFromKey } from "@/pages/admin/company-components/data";
import type { CompanyRow } from "@/pages/admin/company-components/types";

type VisibilityCardProps = {
  selectedCompany: CompanyRow;
  visibilityMap: Record<string, boolean>;
  visibilityLoading: boolean;
  togglePending: boolean;
  onToggle: (args: { key: string; enabled: boolean }) => void;
};

export default function VisibilityCard({
  selectedCompany,
  visibilityMap,
  visibilityLoading,
  togglePending,
  onToggle,
}: VisibilityCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          {selectedCompany.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>Component visibility settings</span>
          <Badge variant="outline" className="text-[11px]">
            {selectedCompany.status}
          </Badge>
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
                disabled={togglePending || visibilityLoading}
                onCheckedChange={(checked) => onToggle({ key, enabled: checked })}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
