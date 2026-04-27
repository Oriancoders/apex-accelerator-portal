import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HelpCircle } from "lucide-react";

interface ExampleCalculationCardProps {
  priorityRates: Record<string, number>;
  difficultyRates: Record<string, number>;
  dollarPerCredit: number;
}

export function ExampleCalculationCard({
  priorityRates,
  difficultyRates,
  dollarPerCredit,
}: ExampleCalculationCardProps) {
  const exPriority = "medium";
  const exDifficulty = "hard";
  const exHours = 3;
  const exPriorityRate = priorityRates[exPriority] ?? 15;
  const exDifficultyRate = difficultyRates[exDifficulty] ?? 20;
  const exPerHour = exPriorityRate + exDifficultyRate;
  const exTotal = exPerHour * exHours;

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-warning" />
          Example Calculation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
          <p className="text-muted-foreground">
            A ticket with <span className="font-semibold text-foreground capitalize">{exPriority}</span> priority,{" "}
            <span className="font-semibold text-foreground capitalize">{exDifficulty}</span> difficulty, estimated at{" "}
            <span className="font-semibold text-foreground">{exHours} hours</span>:
          </p>
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority rate ({exPriority}):</span>
              <span className="font-medium text-foreground">{exPriorityRate} cr/hr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulty rate ({exDifficulty}):</span>
              <span className="font-medium text-foreground">{exDifficultyRate} cr/hr</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Per hour rate:</span>
              <span className="text-primary">{exPerHour} cr/hr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hours:</span>
              <span className="font-medium text-foreground">× {exHours}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total cost:</span>
              <span className="text-accent">{exTotal} credits</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Dollar equivalent:</span>
              <span>${(exTotal * dollarPerCredit).toFixed(2)} USD</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
