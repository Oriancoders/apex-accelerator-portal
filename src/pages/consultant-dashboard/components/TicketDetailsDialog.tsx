import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sanitizeTicketHtml } from "@/lib/sanitize";
import { resolveTicketAttachmentUrl, getAttachmentDisplayName } from "../utils";
import type { TicketDetailRow } from "../types";

interface TicketDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: TicketDetailRow | null | undefined;
  isLoading: boolean;
  ticketId: string | null;
}

export function TicketDetailsDialog({
  isOpen,
  onOpenChange,
  ticket,
  isLoading,
  ticketId,
}: TicketDetailsDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>Full ticket information including description and attachments.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-24 rounded bg-muted animate-pulse" />
            <div className="h-12 rounded bg-muted animate-pulse" />
          </div>
        ) : !ticket ? (
          <p className="text-sm text-muted-foreground">Unable to load ticket details.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">{ticket.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                #{ticket.id.slice(0, 8)} - {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Status</p>
                <p className="text-sm capitalize">{ticket.status.replace("_", " ")}</p>
              </div>
              <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Priority</p>
                <p className="text-sm capitalize">{ticket.priority}</p>
              </div>
              <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Credits</p>
                <p className="text-sm">{ticket.credit_cost ?? "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <div
                className="prose prose-sm max-w-none bg-muted/30 p-3 rounded-ds-md border border-border-subtle text-sm text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeTicketHtml(ticket.description || "") }}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Attachments</p>
              {ticket.file_urls && ticket.file_urls.length > 0 ? (
                <div className="space-y-2">
                  {ticket.file_urls.map((path, idx) => (
                    <a
                      key={`${path}-${idx}`}
                      href={resolveTicketAttachmentUrl(path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-ds-md border border-border-subtle hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm truncate">{getAttachmentDisplayName(path)}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attachments submitted for this ticket.</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {ticketId && (
            <Button variant="outline" onClick={() => navigate(`/tickets/${ticketId}`)}>
              Open Full Page
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
