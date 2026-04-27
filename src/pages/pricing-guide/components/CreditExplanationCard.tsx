import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";

interface CreditExplanationCardProps {
  dollarPerCredit: number;
}

export function CreditExplanationCard({ dollarPerCredit }: CreditExplanationCardProps) {
  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="h-5 w-5 text-accent" />
          What Are Credits?
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          Credits are the currency used to pay for delivered work. Each credit is worth{" "}
          <span className="font-semibold text-foreground">${dollarPerCredit.toFixed(2)} USD</span>.
        </p>
        <p>
          When you submit a ticket, our team reviews it and proposes a solution with a credit cost based on urgency and complexity.
        </p>
      </CardContent>
    </Card>
  );
}
