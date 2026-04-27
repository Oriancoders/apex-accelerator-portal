import { BadgeCheck, CalendarClock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import type { CompanySubscription } from "@/lib/subscriptions";
import { getSubscriptionDaysLeft } from "@/lib/subscriptions";

interface SubscriptionStatusCardProps {
  subscription: CompanySubscription | null;
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  const daysLeft = getSubscriptionDaysLeft(subscription);
  const planName = subscription?.subscription_plans?.name || "Active subscription";

  return (
    <div className="rounded-ds-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      {subscription ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md bg-primary/10 text-primary">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{planName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Subscription tickets skip per-ticket credit approval for this company.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
            <div className="rounded-ds-md border border-primary/15 bg-background/70 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                Days Left
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">{daysLeft}</p>
            </div>
            <div className="rounded-ds-md border border-primary/15 bg-background/70 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                Ends
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {format(new Date(subscription.ends_at), "MMM d")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md bg-muted text-muted-foreground">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No active subscription</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tickets use the normal proposal and credit approval flow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
