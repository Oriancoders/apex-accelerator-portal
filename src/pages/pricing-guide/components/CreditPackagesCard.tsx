import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Gift } from "lucide-react";
import { Link } from "react-router-dom";

interface CreditPackagesCardProps {
  packages: Array<{ buy: number; bonus: number }>;
}

export function CreditPackagesCard({ packages }: CreditPackagesCardProps) {
  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-5 w-5 text-success" />
          Buying Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-3">
        <p>
          Purchase credit packages to fund your service requests. Larger packages include bonus credits at no extra charge!
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {packages.map((pkg, i) => (
            <div key={i} className="text-center p-3 bg-muted rounded-lg">
              <p className="text-lg font-bold text-foreground">{pkg.buy}</p>
              <p className="text-xs text-muted-foreground">credits</p>
              {pkg.bonus > 0 && (
                <Badge variant="outline" className="mt-1 text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">
                  +{pkg.bonus} free
                </Badge>
              )}
            </div>
          ))}
        </div>
        <Button asChild className="w-full gap-2 mt-2">
          <Link to="/credits">
            <Sparkles className="h-4 w-4" />
            Buy Credits Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
