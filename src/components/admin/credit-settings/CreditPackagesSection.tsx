import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Gift, Save, Plus, Trash2 } from "lucide-react";
import { DEFAULT_PACKAGE } from "./constants";

interface Package {
  buy: string;
  bonus: string;
}

interface CreditPackagesSectionProps {
  packages: Package[];
  dollarValue: number;
  onAddPackage: () => void;
  onRemovePackage: (index: number) => void;
  onUpdatePackage: (index: number, field: "buy" | "bonus", value: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function CreditPackagesSection({
  packages,
  dollarValue,
  onAddPackage,
  onRemovePackage,
  onUpdatePackage,
  onSave,
  isSaving,
}: CreditPackagesSectionProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Gift className="h-4 w-4 text-[hsl(var(--success))]" />
            Credit Packages
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddPackage}
            className="rounded-lg h-7 text-xs gap-1"
          >
            <Plus className="h-3 w-3" /> Add Package
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Users pay for the "Buy" amount at ${dollarValue.toFixed(2)}/credit and get bonus credits free
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5 space-y-2">
        {packages.map((pkg, i) => {
          const buyNum = parseInt(pkg.buy) || 0;
          const bonusNum = parseInt(pkg.bonus) || 0;
          const price = buyNum * dollarValue;
          return (
            <div
              key={i}
              className="flex items-center gap-2 p-3 rounded-ds-md bg-muted/50"
            >
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Buy (credits)</Label>
                <Input
                  type="number"
                  min="1"
                  value={pkg.buy}
                  onChange={(e) => onUpdatePackage(i, "buy", e.target.value)}
                  className="h-8 rounded-lg text-sm"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Bonus (free)</Label>
                <Input
                  type="number"
                  min="0"
                  value={pkg.bonus}
                  onChange={(e) => onUpdatePackage(i, "bonus", e.target.value)}
                  className="h-8 rounded-lg text-sm"
                />
              </div>
              <div className="text-center min-w-[80px] space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Preview</p>
                <p className="text-xs font-semibold">${price.toFixed(2)}</p>
                <p className="text-[10px] text-[hsl(var(--success))]">+{bonusNum} free</p>
              </div>
              {packages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => onRemovePackage(i)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          );
        })}
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          className="mt-2 rounded-ds-md gap-1.5"
        >
          <Save className="h-3.5 w-3.5" /> Save Packages
        </Button>
      </CardContent>
    </Card>
  );
}
