import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Gift, Loader2, Sparkles } from "lucide-react";

interface CreditPackage {
  buy: number;
  bonus: number;
}

interface CreditPackagesProps {
  packages: CreditPackage[];
  dollarPerCredit: number;
  onPurchase: (index: number) => void;
  purchasingIndex: number | null;
}

export function CreditPackages({
  packages,
  dollarPerCredit,
  onPurchase,
  purchasingIndex,
}: CreditPackagesProps) {
  const bestValueIndex = packages.length >= 2 ? packages.length - 2 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {packages.map((pkg, i) => {
        const price = pkg.buy * dollarPerCredit;
        const totalCredits = pkg.buy + pkg.bonus;
        const isPopular = i === bestValueIndex;
        const isPurchasing = purchasingIndex === i;

        return (
          <Card
            key={i}
            className={`relative transition-shadow hover:shadow-lg ${
              isPopular ? "border-primary shadow-primary" : ""
            }`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  <Sparkles className="h-3 w-3" /> Best Value
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-3xl font-bold text-foreground">{pkg.buy}</CardTitle>
              <p className="text-sm text-muted-foreground">credits</p>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              {pkg.bonus > 0 && (
                <Badge variant="outline" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] gap-1">
                  <Gift className="h-3 w-3" />
                  +{pkg.bonus} FREE
                </Badge>
              )}
              <div>
                <p className="text-2xl font-bold text-foreground">${price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  ${dollarPerCredit.toFixed(2)}/credit • Get {totalCredits} total
                </p>
              </div>
              <Button
                className="w-full gap-2"
                variant={isPopular ? "default" : "outline"}
                disabled={isPurchasing || purchasingIndex !== null}
                onClick={() => onPurchase(i)}
              >
                {isPurchasing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isPurchasing ? "Redirecting..." : "Purchase"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
