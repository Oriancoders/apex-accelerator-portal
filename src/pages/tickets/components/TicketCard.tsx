import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Coins, Calendar, BarChart3, BadgeCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { STATUS_META, PRIORITY_META } from "@/constants/ticket";

interface TicketCardProps {
  ticket: any;
  onClick: () => void;
  isSubscriptionTicket?: boolean;
}

export function TicketCard({ ticket, onClick, isSubscriptionTicket = false }: TicketCardProps) {
  const sm = STATUS_META[ticket.status] || STATUS_META["submitted"];
  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META["medium"];
  const needsAction = ticket.status === "under_review" || ticket.status === "uat";

  return (
    <Card
      className={`rounded-ds-xl hover:shadow-md transition-all cursor-pointer group border ${
        needsAction ? "border-warning/30 bg-warning/3" : "border-border-subtle"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-ds-md flex items-center justify-center flex-shrink-0 ${sm.bg}`}>
            <span className={sm.color}>{sm.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {ticket.title}
              </h3>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sm.bg} ${sm.color}`}>
                {sm.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pm.bg} ${pm.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />
                {ticket.priority}
              </span>
              {ticket.credit_cost && (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Coins className="h-3 w-3 text-accent" />
                  {ticket.credit_cost} cr
                </span>
              )}
              {isSubscriptionTicket && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  <BadgeCheck className="h-3 w-3" />
                  Subscription covered
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            </div>

            {needsAction && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-md text-[10px] font-semibold">
                <BarChart3 className="h-3 w-3" />
                Action Required
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
