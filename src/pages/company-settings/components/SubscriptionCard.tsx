import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/subscriptions";

interface SubscriptionCardProps {
  activeSubscription: any;
  subscriptionPlans: SubscriptionPlan[];
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
  userCredits: number;
  isPending: boolean;
  onPurchase: (plan: SubscriptionPlan) => void;
}

export function SubscriptionCard({
  activeSubscription,
  subscriptionPlans,
  selectedPlanId,
  setSelectedPlanId,
  userCredits,
  isPending,
  onPurchase,
}: SubscriptionCardProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" /> Subscription
        </CardTitle>
        <CardDescription>
          Active subscriptions let this company submit tickets without per-ticket credit approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeSubscription ? (
          <div className="rounded-ds-md border border-green-500/20 bg-green-500/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm font-semibold text-foreground">
                {activeSubscription.subscription_plans?.name || "Active plan"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Ends {new Date(activeSubscription.ends_at).toLocaleDateString()}. New tickets go directly to approved.
            </p>
            {activeSubscription.partner_commission_credits > 0 && (
              <p className="text-xs text-muted-foreground">
                Partner commission paid: {activeSubscription.partner_commission_credits} credits.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              No active subscription. Tickets follow the normal proposal and credit approval flow.
            </p>
            {subscriptionPlans.length > 0 && (
              <div className="space-y-2">
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="h-10 w-full rounded-ds-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select subscription plan</option>
                  {subscriptionPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price_credits} credits / {plan.duration_days} days
                    </option>
                  ))}
                </select>
                <Button
                  className="w-full rounded-ds-md"
                  disabled={!selectedPlanId || isPending}
                  onClick={() => {
                    const plan = subscriptionPlans.find((p) => p.id === selectedPlanId);
                    if (plan) onPurchase(plan);
                  }}
                >
                  {isPending ? "Activating..." : "Buy Subscription with Credits"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Your balance: {userCredits} credits.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
