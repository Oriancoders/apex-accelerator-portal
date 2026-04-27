import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Coins, CreditCard } from "lucide-react";

export function FeatureCardsSection() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="h-5 w-5 text-primary" />
            Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Tickets are service requests. Use them for support, implementation, changes, bug fixes, and custom delivery work.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-5 w-5 text-accent" />
            Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Credits fund approved work. Normal tickets receive a proposal first, then credits are deducted after approval.
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-green-600" />
            Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Active company subscriptions let members create approved tickets without using per-ticket credits.
        </CardContent>
      </Card>
    </div>
  );
}
