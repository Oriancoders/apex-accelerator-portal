import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";

interface CalculationFormulaCardProps {
  priorityRates: Record<string, number>;
  difficultyRates: Record<string, number>;
}

export function CalculationFormulaCard({ priorityRates, difficultyRates }: CalculationFormulaCardProps) {
  const priorityEntries = Object.entries(priorityRates).sort((a, b) => a[1] - b[1]);
  const difficultyEntries = Object.entries(difficultyRates).sort((a, b) => a[1] - b[1]);

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          How Costs Are Calculated
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-2">The Formula</p>
          <p className="text-lg font-bold text-foreground">
            (Priority Rate + Difficulty Rate) × Hours = Total Credits
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Priority Rates</h3>
            <p className="text-xs text-muted-foreground mb-3">Set by you when creating a ticket</p>
            <div className="space-y-2">
              {priorityEntries.map(([level, rate]) => (
                <div key={level} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <Badge variant="outline" className="capitalize text-xs">
                    {level}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">{rate} cr/hr</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Difficulty Rates</h3>
            <p className="text-xs text-muted-foreground mb-3">Assessed by our experts after review</p>
            <div className="space-y-2">
              {difficultyEntries.map(([level, rate]) => (
                <div key={level} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <Badge variant="outline" className="capitalize text-xs">
                    {level === "easy" ? "🟢" : level === "medium" ? "🟡" : level === "hard" ? "🟠" : "🔴"} {level}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">{rate} cr/hr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
