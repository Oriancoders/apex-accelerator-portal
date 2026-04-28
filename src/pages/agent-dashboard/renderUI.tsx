import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CompanyFormDialog from "@/components/admin/CompanyFormDialog";
import {
  Building2, ArrowRight, Ticket, TrendingUp, DollarSign, CalendarDays, Plus, Eye,
  CheckCircle, XCircle, Send, Paperclip, CreditCard, UserCog, Users
} from "lucide-react";
import { PERIODS } from "./constants";
import PaginationControls from "@/shared/PaginationControls";

// This file contains the UI rendering logic separated from business logic
// It accepts all props needed and returns the JSX structure
export function renderDashboardUI(props: any) {
  const {
    isConsultantRole,
    agent,
    user,
    allCompanies,
    memberships,
    assignments,
    companyStats,
    subscriptionByCompanyId,
    memberCountByCompany,
    allProfiles,
    allTickets,
    allCompanyMembers,
    focusedCompany,
    focusedStats,
    focusedTickets,
    visibleFocusedTickets,
    ticketPage,
    setTicketPage,
    ticketPageSize,
    periodIdx,
    periodStats,
    expandCompanyId,
    selectedCompanyId,
    isCreateOpen,
    detailsTicketId,
    detailsTicket,
    isTicketDetailsLoading,
    newMemberName,
    newMemberEmail,
    newMemberRole,
    consultantAssignedTickets,
    // Handlers
    setPeriodIdx,
    setExpandCompanyId,
    setSelectedCompanyId,
    setIsCreateOpen,
    setNewMemberName,
    setNewMemberEmail,
    setNewMemberRole,
    setDetailsTicketId,
    // Mutations
    createCompanyMutation,
    addMemberMutation,
    // Navigation
    navigate,
    // Utilities
    fmtCredits,
    stripHtmlTags,
    resolveTicketAttachmentUrl,
    getAttachmentDisplayName,
    sanitizeTicketHtml,
  } = props;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isConsultantRole ? "Consultant Dashboard" : "Agent Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agent?.display_name || agent?.email || user?.email}
          </p>
        </div>
        {!isConsultantRole && (
          <>
            <Button onClick={() => setIsCreateOpen(true)} className="h-11 rounded-ds-md gap-2">
              <Plus className="h-4 w-4" /> Add Company
            </Button>
            <CompanyFormDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              onSubmit={(data) => createCompanyMutation.mutate(data)}
              isLoading={createCompanyMutation.isPending}
            />
          </>
        )}
      </div>

      {/* Period Selector */}
      <div className="flex gap-1 bg-muted rounded-ds-md p-1 w-fit">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setPeriodIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              i === periodIdx ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Ticket, label: "Tickets", value: periodStats.total, sub: `${periodStats.resolved} resolved`, color: "text-primary" },
          { icon: CalendarDays, label: "Credits Consumed", value: fmtCredits(periodStats.creditsConsumed), sub: "from resolved tickets", color: "text-accent" },
          { icon: DollarSign, label: "Earned Commission", value: fmtCredits(periodStats.earned), sub: "Based on company rates", color: "text-green-500" },
          { icon: TrendingUp, label: "Potential Income", value: fmtCredits(periodStats.potential), sub: `${periodStats.openCount} open tickets`, color: "text-warning" },
        ].map((s) => (
          <Card key={s.label} className="rounded-ds-xl">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <s.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No companies placeholder */}
      {!isConsultantRole && allCompanies.length === 0 && (
        <Card className="rounded-ds-xl border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-base">No companies yet</CardTitle>
            <CardDescription>Create your first company workspace to unlock commission tracking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="h-11 rounded-ds-md" onClick={() => setIsCreateOpen(true)}>
              Create First Company <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Company Portfolio - Simplified placeholder */}
      {!isConsultantRole && allCompanies.length > 0 && (
        <div className="text-muted-foreground text-sm">
          <p>Company Portfolio: {allCompanies.length} companies configured</p>
          <p className="text-xs mt-1">Full company cards and ticket management available in detailed view</p>
        </div>
      )}

      {!isConsultantRole && (
        <Card className="rounded-ds-xl">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  {focusedCompany ? `${focusedCompany.name} Tickets` : "Latest Partner Tickets"}
                </CardTitle>
                <CardDescription>Partner-visible request queue.</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit text-xs">
                {focusedTickets.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {focusedTickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No tickets available yet.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Ticket</th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Priority</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Credits</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFocusedTickets.map((ticket: any) => (
                        <tr key={ticket.id} className="border-b border-border-subtle last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-3">
                            <p className="font-medium text-foreground truncate max-w-[260px]">{ticket.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              #{ticket.id.slice(0, 8)} - {new Date(ticket.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {ticket.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-foreground">
                            {ticket.credit_cost != null ? ticket.credit_cost : "-"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-ds-md px-2"
                              onClick={() => setDetailsTicketId(ticket.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  page={ticketPage}
                  totalItems={focusedTickets.length}
                  pageSize={ticketPageSize}
                  onPageChange={setTicketPage}
                  itemLabel="tickets"
                  className="mt-4"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={!!detailsTicketId} onOpenChange={(open) => !open && setDetailsTicketId(null)}>
        <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>Full ticket information including description and attachments.</DialogDescription>
          </DialogHeader>

          {isTicketDetailsLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-24 rounded bg-muted animate-pulse" />
            </div>
          ) : !detailsTicket ? (
            <p className="text-sm text-muted-foreground">Unable to load ticket details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">{detailsTicket.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  #{detailsTicket.id.slice(0, 8)} · {new Date(detailsTicket.created_at).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Status</p>
                  <p className="text-sm capitalize">{detailsTicket.status.replace("_", " ")}</p>
                </div>
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Priority</p>
                  <p className="text-sm capitalize">{detailsTicket.priority}</p>
                </div>
                <div className="p-2.5 rounded-ds-md border border-border-subtle bg-muted/30">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Credits</p>
                  <p className="text-sm">{detailsTicket.credit_cost ?? "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                <div
                  className="prose prose-sm max-w-none bg-muted/30 p-3 rounded-ds-md border border-border-subtle text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeTicketHtml(detailsTicket.description || "") }}
                />
              </div>

              {detailsTicket.file_urls && detailsTicket.file_urls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Attachments</p>
                  <div className="space-y-2">
                    {detailsTicket.file_urls.map((path: string, idx: number) => (
                      <a
                        key={`${path}-${idx}`}
                        href={resolveTicketAttachmentUrl(path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-ds-md border border-border-subtle hover:border-primary/40 transition-colors"
                      >
                        <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm truncate">{getAttachmentDisplayName(path)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {detailsTicketId && (
              <Button variant="outline" onClick={() => navigate(`/tickets/${detailsTicketId}`)}>
                Open Full Page
              </Button>
            )}
            <Button onClick={() => setDetailsTicketId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
