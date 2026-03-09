import { STATUS_META } from "@/constants/ticket";
import { formatDuration } from "@/utils/format";
import { Timer, Coins, Activity } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type TicketEvent = Tables<"ticket_events">;
type Ticket = Tables<"tickets">;

interface LifecycleStatsProps {
  events: TicketEvent[];
  ticket: Ticket;
}

export default function LifecycleStats({ events, ticket }: LifecycleStatsProps) {
  const totalMins =
    events.length > 1
      ? differenceInMinutes(new Date(events[events.length - 1].created_at), new Date(events[0].created_at))
      : 0;

  const stageDurations: { stage: string; mins: number }[] = [];
  for (let i = 0; i < events.length - 1; i++) {
    const mins = differenceInMinutes(new Date(events[i + 1].created_at), new Date(events[i].created_at));
    stageDurations.push({ stage: events[i].to_status, mins });
  }
  const maxMins = Math.max(...stageDurations.map((s) => s.mins), 1);

  return (
    <div className="space-y-5">
      {/* KPI chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-center">
          <Timer className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{formatDuration(totalMins)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Time</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/15 text-center">
          <Coins className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{ticket.credit_cost ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Credits</p>
        </div>
        <div className="p-4 rounded-xl bg-success/5 border border-success/15 text-center">
          <Activity className="h-5 w-5 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{events.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Events</p>
        </div>
      </div>

      {/* Bar chart of stage durations */}
      {stageDurations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Time per Stage</p>
          {stageDurations.map((s, i) => {
            const m = STATUS_META[s.stage] || STATUS_META.submitted;
            const pct = Math.round((s.mins / maxMins) * 100);
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-medium ${m.color}`}>{m.label}</span>
                  <span className="text-muted-foreground">{formatDuration(s.mins)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
