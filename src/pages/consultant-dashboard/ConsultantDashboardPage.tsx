import { useMemo, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import { useAssignedTickets, useProfiles, useCompanies, useRequestChangeEvents, useTicketDetails } from "./hooks/useConsultantDashboardQueries";
import { useRespondAssignmentMutation, useSendToUatMutation } from "./hooks/useConsultantDashboardMutations";
import { TicketsTable } from "./components/TicketsTable";
import { TicketDetailsDialog } from "./components/TicketDetailsDialog";

export default function ConsultantDashboardPage() {
  const { user } = useAuth();
  const [detailsTicketId, setDetailsTicketId] = useState<string | null>(null);

  const { data: assignedTickets = [], isLoading: isTicketsLoading } = useAssignedTickets(user?.id);

  const userIds = useMemo(() => [...new Set(assignedTickets.map((ticket) => ticket.user_id).filter(Boolean))], [assignedTickets]);
  const companyIds = useMemo(
    () => [...new Set(assignedTickets.map((ticket) => ticket.company_id).filter(Boolean))] as string[],
    [assignedTickets]
  );
  const ticketIds = useMemo(() => assignedTickets.map((ticket) => ticket.id), [assignedTickets]);

  const { data: profiles = [] } = useProfiles(userIds);
  const { data: companies = [] } = useCompanies(companyIds);
  const { data: requestChangeEvents = [] } = useRequestChangeEvents(ticketIds);
  const { data: detailsTicket, isLoading: isTicketDetailsLoading } = useTicketDetails(detailsTicketId);

  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.user_id, profile])), [profiles]);
  const companiesById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies]);

  const requestChangesByTicketId = useMemo(() => {
    const map: Record<string, any[]> = {};
    requestChangeEvents.forEach((event) => {
      if (!map[event.ticket_id]) map[event.ticket_id] = [];
      map[event.ticket_id].push(event);
    });
    return map;
  }, [requestChangeEvents]);

  const pendingTickets = useMemo(
    () => assignedTickets.filter((ticket) => ticket.assignment_status === "pending"),
    [assignedTickets]
  );
  const inProgressTickets = useMemo(
    () => assignedTickets.filter((ticket) => ticket.assignment_status === "accepted" && ticket.status === "in_progress"),
    [assignedTickets]
  );
  const historyTickets = useMemo(
    () =>
      assignedTickets.filter(
        (ticket) => !(ticket.assignment_status === "pending") && !(ticket.assignment_status === "accepted" && ticket.status === "in_progress")
      ),
    [assignedTickets]
  );

  const respondAssignmentMutation = useRespondAssignmentMutation();
  const sendToUatMutation = useSendToUatMutation();

  const sections = [
    {
      key: "pending",
      title: "Newly Assigned Tickets",
      subtitle: "Accept to start work. Decline will return the ticket to admin for reassignment.",
      rows: pendingTickets,
    },
    {
      key: "active",
      title: "Current In Progress Tickets",
      subtitle: "Your active delivery queue. Send to UAT once implementation is complete.",
      rows: inProgressTickets,
    },
    {
      key: "history",
      title: "Assigned Ticket History",
      subtitle: "Older assigned tickets including approved, UAT, completed, and cancelled items.",
      rows: historyTickets,
    },
  ];

  return (
    <ProtectedLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
            <Ticket className="h-4 w-4" />
            Consultant Workspace
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Consultant Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Assigned work queue for {user?.email || "your consultant account"}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-ds-xl border-warning/30 bg-warning/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Newly Assigned</p>
              <p className="text-2xl font-bold text-warning mt-1">{pendingTickets.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting your accept/decline</p>
            </CardContent>
          </Card>
          <Card className="rounded-ds-xl border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Active In Progress</p>
              <p className="text-2xl font-bold text-primary mt-1">{inProgressTickets.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Currently in delivery stage</p>
            </CardContent>
          </Card>
          <Card className="rounded-ds-xl border-border-subtle bg-muted/30">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Assigned History</p>
              <p className="text-2xl font-bold text-foreground mt-1">{historyTickets.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Previous or non-active assignments</p>
            </CardContent>
          </Card>
        </div>

        {isTicketsLoading ? (
          <Card className="rounded-ds-xl">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Loading consultant workspace...
            </CardContent>
          </Card>
        ) : (
          sections.map((section) => (
            <div key={section.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{section.subtitle}</p>
                </div>
                <span className="text-xs text-muted-foreground">{section.rows.length} tickets</span>
              </div>

              {section.rows.length === 0 ? (
                <Card className="rounded-ds-xl border-border-subtle">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No tickets in this section yet.
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-ds-xl">
                  <CardContent className="p-0">
                    <TicketsTable
                      tickets={section.rows}
                      profilesById={profilesById}
                      companiesById={companiesById}
                      requestChangesByTicketId={requestChangesByTicketId}
                      userId={user?.id}
                      respondMutation={respondAssignmentMutation}
                      sendToUatMutation={sendToUatMutation}
                      onViewDetails={setDetailsTicketId}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ))
        )}

        <Card className="rounded-ds-xl border-border-subtle">
          <div className="p-6">
            <h3 className="text-base font-semibold text-foreground">Delivery Notes</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Use the ticket detail page for full conversations, files, and admin/client context.
            </p>
          </div>
        </Card>
      </div>

      <TicketDetailsDialog
        isOpen={!!detailsTicketId}
        onOpenChange={(open) => !open && setDetailsTicketId(null)}
        ticket={detailsTicket}
        isLoading={isTicketDetailsLoading}
        ticketId={detailsTicketId}
      />
    </ProtectedLayout>
  );
}
