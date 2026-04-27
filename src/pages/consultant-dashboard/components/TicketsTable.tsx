import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Eye, Paperclip, Send, XCircle } from "lucide-react";
import type { ConsultantTicket, ProfileRow, CompanyRow, TicketEventRow } from "../types";
import { plainText } from "../utils";

interface TicketsTableProps {
  tickets: ConsultantTicket[];
  profilesById: Map<string, ProfileRow>;
  companiesById: Map<string, CompanyRow>;
  requestChangesByTicketId: Record<string, TicketEventRow[]>;
  userId: string | undefined;
  respondMutation: any;
  sendToUatMutation: any;
  onViewDetails: (ticketId: string) => void;
}

export function TicketsTable({
  tickets,
  profilesById,
  companiesById,
  requestChangesByTicketId,
  userId,
  respondMutation,
  sendToUatMutation,
  onViewDetails,
}: TicketsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Client / Company</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Request Changes</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Priority</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Credits</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const profile = profilesById.get(ticket.user_id);
            const company = ticket.company_id ? companiesById.get(ticket.company_id) : null;
            const canRespondAssignment = ticket.assigned_consultant_id === userId && ticket.assignment_status === "pending";
            const canSendToUat = ticket.assigned_consultant_id === userId && ticket.assignment_status === "accepted" && ticket.status === "in_progress";
            const requestChangesEvents = requestChangesByTicketId[ticket.id] || [];
            const latestRequestChanges = requestChangesEvents[0];
            const latestFeedback = latestRequestChanges?.note
              ?.replace(/^Client requested changes after UAT:\s*/i, "")
              .trim();

            return (
              <tr key={ticket.id} className="border-b border-border-subtle last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground truncate max-w-[240px]">{ticket.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[260px] mt-1">
                    {plainText(ticket.description)}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Paperclip className="h-3 w-3" />
                    {Array.isArray(ticket.file_urls) ? ticket.file_urls.length : 0} attachment{Array.isArray(ticket.file_urls) && ticket.file_urls.length === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{profile?.full_name || "Unknown User"}</span>
                    <span className="text-[10px] text-muted-foreground">{company?.name || "Unknown Company"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px] capitalize">{ticket.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {requestChangesEvents.length > 0 ? (
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {requestChangesEvents.length} request{requestChangesEvents.length > 1 ? "s" : ""}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground max-w-[220px] truncate" title={latestFeedback || latestRequestChanges?.note || ""}>
                        {latestFeedback || latestRequestChanges?.note}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No requests</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant="secondary" className="text-[10px] capitalize">{ticket.priority}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {ticket.credit_cost != null ? ticket.credit_cost : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {canRespondAssignment && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-ds-md px-2 text-[10px]"
                          disabled={respondMutation.isPending}
                          onClick={() => respondMutation.mutate({ ticketId: ticket.id, accept: true })}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-ds-md px-2 text-[10px] text-destructive"
                          disabled={respondMutation.isPending}
                          onClick={() => respondMutation.mutate({ ticketId: ticket.id, accept: false })}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Decline
                        </Button>
                      </>
                    )}
                    {canSendToUat && (
                      <Button
                        size="sm"
                        className="h-7 rounded-ds-md px-2 text-[10px]"
                        disabled={sendToUatMutation.isPending}
                        onClick={() => sendToUatMutation.mutate(ticket.id)}
                      >
                        <Send className="h-3 w-3 mr-1" /> Send UAT
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-ds-md px-2 text-[10px]"
                      onClick={() => onViewDetails(ticket.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
