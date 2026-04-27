import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { PROCESS_STEPS } from "../constants";

export function ProcessStepsCard() {
  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          The Process
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {PROCESS_STEPS.map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
