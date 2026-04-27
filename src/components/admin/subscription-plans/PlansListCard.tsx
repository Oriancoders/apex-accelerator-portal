import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { SubscriptionPlan } from "./types";

interface PlansListCardProps {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isToggling: boolean;
}

export function PlansListCard({
  plans,
  isLoading,
  onEdit,
  onToggle,
  onDelete,
  isDeleting,
  isToggling,
}: PlansListCardProps) {
  return (
    <Card className="rounded-ds-xl lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Subscription Plans</CardTitle>
        <CardDescription>
          Admin can create, alter, disable, or delete unused plans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Loading plans...
          </p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No plans yet.
          </p>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-ds-md border border-border-subtle p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {plan.name}
                    </p>
                    {plan.is_default && (
                      <Badge className="text-[10px]">Default</Badge>
                    )}
                    <Badge
                      variant={plan.is_active ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {plan.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.price_credits} credits / {plan.duration_days} days ·
                    partner {plan.partner_commission_percent}%
                  </p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(plan)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isToggling}
                    onClick={() => onToggle(plan.id, !plan.is_active)}
                  >
                    {plan.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive"
                    disabled={isDeleting}
                    onClick={() => onDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
