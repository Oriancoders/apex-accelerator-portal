import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ActiveSubscription, SubscriptionPlan } from "./types";
import { formatSubscriptionEndDate } from "./utils";

interface CompanySubscriptionsCardProps {
  subscriptions: ActiveSubscription[];
  plans: SubscriptionPlan[];
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

export function CompanySubscriptionsCard({
  subscriptions,
  plans,
  onCancel,
  isCancelling,
}: CompanySubscriptionsCardProps) {
  const planById = useMemo(
    () => new Map(plans.map((plan) => [plan.id, plan])),
    [plans]
  );

  return (
    <Card className="rounded-ds-xl lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base">Active Company Subscriptions</CardTitle>
        <CardDescription>
          Current subscribed companies and partner commission credits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No active subscriptions yet.
          </p>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((subscription) => {
              const plan = planById.get(subscription.plan_id);
              return (
                <div
                  key={subscription.id}
                  className="grid gap-2 rounded-ds-md border border-border-subtle p-3 sm:grid-cols-5 sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {subscription.companies?.name || subscription.company_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subscription.companies?.slug}
                    </p>
                  </div>
                  <p className="text-sm">
                    {subscription.subscription_plans?.name ||
                      plan?.name ||
                      "Plan"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ends {formatSubscriptionEndDate(subscription.ends_at)}
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-right">
                    Partner commission: {subscription.partner_commission_credits}{" "}
                    credits
                  </p>
                  <div className="sm:text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={isCancelling}
                      onClick={() => onCancel(subscription.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
