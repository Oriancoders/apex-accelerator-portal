import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

const packages = [
  { credits: 10, price: 29, perCredit: "2.90", popular: false },
  { credits: 50, price: 119, perCredit: "2.38", popular: true },
  { credits: 100, price: 199, perCredit: "1.99", popular: false },
  { credits: 250, price: 449, perCredit: "1.80", popular: false },
];

export default function CreditsPage() {
  const { profile } = useAuth();

  const handlePurchase = (credits: number, price: number) => {
    // Stripe checkout integration placeholder
    toast.info(`Stripe Checkout will open for ${credits} credits at $${price}. Configure STRIPE_SECRET_KEY and create a Stripe checkout edge function.`);
  };

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
          {packages.map((pkg) => (
            <Card
              key={pkg.credits}
              className={`relative transition-shadow hover:shadow-lg ${
                pkg.popular ? "border-primary shadow-primary" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    <Sparkles className="h-3 w-3" /> Best Value
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-3xl font-bold text-foreground">{pkg.credits}</CardTitle>
                <p className="text-sm text-muted-foreground">credits</p>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">${pkg.price}</p>
                  <p className="text-xs text-muted-foreground">${pkg.perCredit} per credit</p>
                </div>
                <Button
                  className={`w-full gap-2 ${pkg.popular ? "" : ""}`}
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(pkg.credits, pkg.price)}
                >
                  <CreditCard className="h-4 w-4" />
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
}
