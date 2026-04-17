import { useState } from "react";
import { AlertCircle, Paperclip, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { TicketStatus, TicketType } from "@/pages/admin/tickets/types";

type UATPanelProps = {
  ticket: TicketType;
  onUpdate: () => void;
};

export default function UATPanel({ ticket, onUpdate }: UATPanelProps) {
  const [uatNotes, setUatNotes] = useState(ticket.uat_notes || "");
  const [uatUrl, setUatUrl] = useState((ticket.uat_attachments || [])[0] || "");
  const [saving, setSaving] = useState(false);

  const sendToUAT = async () => {
    setSaving(true);
    const attachments = uatUrl ? [uatUrl] : [];

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "uat" as TicketStatus,
        uat_notes: uatNotes || null,
        uat_attachments: attachments.length ? attachments : null,
      })
      .eq("id", ticket.id);

    if (error) {
      toast.error("Operation failed. Please try again.");
    } else {
      await supabase.from("ticket_events").insert({
        ticket_id: ticket.id,
        from_status: ticket.status,
        to_status: "uat",
        note: uatNotes || "Admin moved ticket to UAT.",
        attachments: attachments.length ? attachments : null,
      });
      toast.success("Ticket sent to UAT! Client notified.");
      onUpdate();
    }

    setSaving(false);
  };

  if (ticket.status === "uat") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-info/10 border border-info/20">
          <Target className="h-4 w-4 text-info flex-shrink-0" />
          <p className="text-sm text-foreground font-medium">Ticket is currently in UAT. Client is reviewing.</p>
        </div>
        {ticket.uat_notes && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes Sent to Client</p>
            <p className="text-sm text-foreground bg-muted/60 p-3 rounded-xl border border-border">{ticket.uat_notes}</p>
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
                  className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 border border-primary/20 p-2.5 rounded-xl"
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
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
        UAT panel is available once the ticket is In Progress or Approved.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Send to UAT</p>
          <p className="text-xs text-muted-foreground mt-0.5">Attach deliverable links and write UAT notes for the client before sending.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Deliverable URL / Link
          </label>
          <Input
            placeholder="https://staging.example.com or Google Drive link..."
            value={uatUrl}
            onChange={(e) => setUatUrl(e.target.value)}
            className="rounded-xl h-10"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            UAT Notes for Client
          </label>
          <Textarea
            placeholder="Explain what was built, what to test, known limitations, access credentials if any..."
            value={uatNotes}
            onChange={(e) => setUatNotes(e.target.value)}
            rows={5}
            className="rounded-xl resize-none"
          />
        </div>
      </div>

      <Button className="w-full rounded-xl h-11 gap-2" onClick={sendToUAT} disabled={saving}>
        <Target className="h-4 w-4" />
        {saving ? "Sending to UAT..." : "Send to UAT →"}
      </Button>
    </div>
  );
}
