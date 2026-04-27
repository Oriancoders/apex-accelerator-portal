import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Layers, Save } from "lucide-react";
import { DIFFICULTY_LABELS } from "./constants";

interface DifficultyRatesSectionProps {
  rates: Record<string, string>;
  onChange: (rates: Record<string, string>) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function DifficultyRatesSection({
  rates,
  onChange,
  onSave,
  isSaving,
}: DifficultyRatesSectionProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Difficulty Level Rates
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Credits added per hour based on task difficulty (set by admin)
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  value={rates[key] || "0"}
                  onChange={(e) =>
                    onChange({ ...rates, [key]: e.target.value })
                  }
                  className="h-9 rounded-lg text-sm pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  cr/hr
                </span>
              </div>
            </div>
          ))}
        </div>
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          className="mt-3 rounded-ds-md gap-1.5"
        >
          <Save className="h-3.5 w-3.5" /> Save Difficulty Rates
        </Button>
      </CardContent>
    </Card>
  );
}
