import { Card, CardContent } from "@/components/ui/card";
import { Users, Ticket, CreditCard } from "lucide-react";

interface StatsCardsProps {
  memberCount: number;
  totalTickets: number;
  openTickets: number;
  hasSubscription: boolean;
}

export function StatsCards({ memberCount, totalTickets, openTickets, hasSubscription }: StatsCardsProps) {
  const stats = [
    { icon: Users, label: "Members", value: memberCount, color: "text-primary" },
    { icon: Ticket, label: "Total Tickets", value: totalTickets, color: "text-accent" },
    { icon: Ticket, label: "Open Tickets", value: openTickets, color: "text-warning" },
    { icon: CreditCard, label: "Subscription", value: hasSubscription ? "Active" : "None", color: hasSubscription ? "text-green-500" : "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="rounded-ds-xl">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${s.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
