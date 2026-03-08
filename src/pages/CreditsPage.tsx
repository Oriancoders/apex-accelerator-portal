import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Sparkles, Gift } from "lucide-react";
import { toast } from "sonner";
import { useCreditSettings } from "@/hooks/useCreditSettings";

export default function CreditsPage() {
  const { profile } = useAuth();
  const { settings, isLoading } = useCreditSettings();

  const handlePurchase = (buy: number, bonus: number, price: number) => {
    toast.info(
      `Stripe Checkout will open for ${buy} credits (+${bonus} free) at $${price.toFixed(2)}. Configure STRIPE_SECRET_KEY and create a Stripe checkout edge function.`
    );
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </ProtectedLayout>
    );
  }

  const bestValueIndex = settings.packages.length >= 2 ? settings.packages.length - 2 : 0;

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Buy Credits</h1>
          <p className="text-muted-foreground mt-1">Credits are used to pay for Salesforce service requests</p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-muted rounded-full">
            <Coins className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold text-foreground">{profile?.credits ?? 0}</span>
            <span className="text-sm text-muted-foreground">current balance</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {settings.packages.map((pkg, i) => {
            const price = pkg.buy * settings.dollarPerCredit;
            const totalCredits = pkg.buy + pkg.bonus;
            const isPopular = i === bestValueIndex;

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
                      ${settings.dollarPerCredit.toFixed(2)}/credit • Get {totalCredits} total
                    </p>
                  </div>
                  <Button
                    className="w-full gap-2"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handlePurchase(pkg.buy, pkg.bonus, price)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ProtectedLayout>
  );
}
