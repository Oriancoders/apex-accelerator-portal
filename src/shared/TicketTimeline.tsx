import { STATUS_META } from "@/constants/ticket";
import { formatDuration } from "@/utils/format";
import StatusBadge from "@/shared/StatusBadge";
import { ArrowRight, Clock, Paperclip } from "lucide-react";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type TicketEvent = Tables<"ticket_events">;

interface TicketTimelineProps {
  events: TicketEvent[];
}

export default function TicketTimeline({ events }: TicketTimelineProps) {
  if (!events.length) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
        No status changes recorded yet.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
      {events.map((ev, i) => {
        const next = events[i + 1];
        const durMins = next
          ? differenceInMinutes(new Date(next.created_at), new Date(ev.created_at))
          : differenceInMinutes(new Date(), new Date(ev.created_at));
        const m = STATUS_META[ev.to_status] || STATUS_META.submitted;
        return (
          <div key={ev.id} className="relative pl-14 pb-6">
            <div className={`absolute left-2.5 top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${m.bg} ${m.border}`}>
              <span className={m.color}>{m.icon}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {ev.from_status && (
                    <>
                      <StatusBadge status={ev.from_status} />
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </>
                  )}
                  <StatusBadge status={ev.to_status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(ev.created_at), "MMM d, yyyy · h:mm a")}
                  <span className="mx-1.5 text-border">·</span>
                  {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                </p>
                {ev.note && (
                  <p className="text-xs text-foreground mt-2 bg-muted/60 px-3 py-2 rounded-lg border border-border-subtle">
                    {ev.note}
                  </p>
                )}
                {ev.attachments && ev.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ev.attachments.map((url, ai) => (
                      <a
                        key={ai}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg"
                      >
                        <Paperclip className="h-3 w-3" /> Attachment {ai + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {i < events.length - 1 && (
                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {formatDuration(durMins)} here
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
