import AdminLayout from "@/components/AdminLayout";
import { useNavigate } from "react-router-dom";
import TicketsHeader from "@/pages/admin/tickets/TicketsHeader";
import TicketsListCard from "@/pages/admin/tickets/TicketsListCard";
import TicketsStatsRow from "@/pages/admin/tickets/TicketsStatsRow";
import { useAdminTicketsPage } from "@/pages/admin/tickets/useAdminTicketsPage";
import { useMemo, useState } from "react";
import type { TicketType } from "@/pages/admin/tickets/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { sanitizeTicketHtml } from "@/lib/sanitize";
import { supabase } from "@/integrations/supabase/client";

const resolveTicketAttachmentUrl = (rawPath: string): string => {
  if (!rawPath) return "#";
  if (/^https?:\/\//i.test(rawPath)) return "#";
  const { data } = supabase.storage.from("ticket-attachments").getPublicUrl(rawPath);
  return data.publicUrl;
};

const getAttachmentDisplayName = (rawPath: string): string => {
  if (!rawPath) return "Attachment";
  return rawPath.split("/").pop() || rawPath;
};

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    realtimePulse,
    isLoading,
    tickets,
    filtered,
    counts,
  } = useAdminTicketsPage();

  const previewTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === previewTicketId) || null,
    [tickets, previewTicketId]
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <TicketsHeader total={tickets.length} actionCount={counts.action} realtimePulse={realtimePulse} />

        <TicketsStatsRow
          submitted={counts.submitted}
          inProgress={counts.in_progress}
          uat={counts.uat}
          completed={counts.completed}
          onStatusClick={setStatusFilter}
        />

        <TicketsListCard
          search={search}
          statusFilter={statusFilter}
          isLoading={isLoading}
          tickets={filtered}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onOpenTicket={(ticket) => setPreviewTicketId(ticket.id)}
        />
      </div>

      <Dialog open={!!previewTicketId} onOpenChange={(open) => !open && setPreviewTicketId(null)}>
        <DialogContent className="sm:max-w-[760px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Preview</DialogTitle>
            <DialogDescription>
              Full ticket details and attachments without leaving the list.
            </DialogDescription>
          </DialogHeader>

          {!previewTicket ? (
            <p className="text-sm text-muted-foreground">Ticket not available in current filter.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">{previewTicket.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  #{previewTicket.id.slice(0, 8)} · {new Date(previewTicket.created_at).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Status</p>
                  <p className="text-sm capitalize">{previewTicket.status.replace("_", " ")}</p>
                </div>
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Priority</p>
                  <p className="text-sm capitalize">{previewTicket.priority}</p>
                </div>
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Credits</p>
                  <p className="text-sm">{previewTicket.credit_cost ?? "—"}</p>
                </div>
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Contact Email</p>
                  <p className="text-sm break-all">{previewTicket.contact_email || "—"}</p>
                </div>
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Contact Phone</p>
                  <p className="text-sm">{previewTicket.contact_phone || "—"}</p>
                </div>
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Estimated Hours</p>
                  <p className="text-sm">{previewTicket.estimated_hours ?? "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                <div
                  className="prose prose-sm max-w-none bg-muted/30 p-3 rounded-ds-md border border-border-subtle text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeTicketHtml(previewTicket.description || "") }}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Attachments</p>
                {previewTicket.file_urls && previewTicket.file_urls.length > 0 ? (
                  <div className="space-y-2">
                    {previewTicket.file_urls.map((path, idx) => (
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
            {previewTicket && (
              <Button variant="outline" onClick={() => navigate(`/admin/tickets/${previewTicket.id}`)}>
                Open Full Ticket
              </Button>
            )}
            <Button onClick={() => setPreviewTicketId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
