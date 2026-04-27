import { AlertCircle, Paperclip, RotateCcw, Target } from "lucide-react";
import { format } from "date-fns";
import type { TicketType } from "@/pages/admin/tickets/types";

type UATPanelProps = {
  ticket: TicketType;
  requestChangesHistory: Array<{
    id: string;
    created_at: string;
    note: string | null;
  }>;
};

export default function UATPanel({ ticket, requestChangesHistory }: UATPanelProps) {

  if (ticket.status === "uat") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-ds-md bg-info/10 border border-info/20">
          <Target className="h-4 w-4 text-info flex-shrink-0" />
          <p className="text-sm text-foreground font-medium">Ticket is currently in UAT. Client is reviewing.</p>
        </div>
        {ticket.uat_notes && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes Sent to Client</p>
            <p className="text-sm text-foreground bg-muted/60 p-3 rounded-ds-md border border-border-subtle">{ticket.uat_notes}</p>
          </div>
        )}
        {ticket.uat_attachments && ticket.uat_attachments.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Deliverable Links</p>
            <div className="space-y-2">
              {ticket.uat_attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 border border-primary/20 p-2.5 rounded-ds-md"
                >
                  <Paperclip className="h-4 w-4" /> {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  if (!["in_progress", "approved"].includes(ticket.status)) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
          UAT panel is available once the ticket is In Progress or Approved.
        </div>
        <RequestChangesHistory items={requestChangesHistory} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-ds-md bg-warning/10 border border-warning/20">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Consultant-Owned UAT Handoff</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Only the assigned consultant can send tickets to UAT after accepting the assignment.
            Admin can review notes, links, and request-change history here.
          </p>
        </div>
      </div>

      <RequestChangesHistory items={requestChangesHistory} />
    </div>
  );
}

function RequestChangesHistory({
  items,
}: {
  items: Array<{ id: string; created_at: string; note: string | null }>;
}) {
  return (
    <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-4 w-4 text-warning" />
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Request Changes History</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No request-changes feedback has been submitted yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const feedback = (item.note || "")
              .replace(/^Client requested changes after UAT:\s*/i, "")
              .trim();

            return (
              <div key={item.id} className="rounded-ds-md border border-border-subtle bg-background/70 px-3 py-2">
                <p className="text-[11px] text-muted-foreground mb-1">
                  {format(new Date(item.created_at), "MMM d, yyyy · h:mm a")}
                </p>
                <p className="text-xs text-foreground">{feedback || item.note || "(No feedback text)"}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
