import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Save } from "lucide-react";
import { validateDollarPerCredit } from "./utils";

interface PricePerCreditSectionProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function PricePerCreditSection({
  value,
  onChange,
  onSave,
  isSaving,
}: PricePerCreditSectionProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Price Per Credit
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Dollar amount ($) per 1 credit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-7 h-10 rounded-ds-md"
              />
            </div>
          </div>
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
            className="rounded-ds-md gap-1.5 h-10"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
