import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Lock, ClipboardCheck, Activity, CheckCircle, Coins } from "lucide-react";
import { useState } from "react";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useUserRole } from "@/hooks/useUserRole";
import { FILTER_TABS, isActiveStatus, TICKET_PAGE_SIZE } from "@/constants/ticket";
import { useTicketsList, useRealtimeTickets } from "./hooks";
import { filterTickets, getTicketPaths } from "./utils";
import { TicketCard } from "./components/TicketCard";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveSubscription } from "@/lib/subscriptions";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/shared/PaginationControls";

export default function TicketsPage() {
  const { user, isGuest } = useAuth();
  const { activeCompany } = useAgentTenant();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");

  const { data: tickets = [], isLoading } = useTicketsList(user?.id, role, activeCompany?.id);
  const { realtimePulse, prevStatusRef } = useRealtimeTickets(user?.id, role, activeCompany?.id);
  const { data: activeSubscription = null } = useQuery({
    queryKey: ["company-active-subscription", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany?.id) return null;
      return fetchActiveSubscription(activeCompany.id);
    },
    enabled: !!activeCompany?.id && (role === "company_admin" || role === "member"),
  });

  const { ticketListPath, newTicketPath } = getTicketPaths(role, activeCompany?.slug);

  const isCompanyAdminView = role === "company_admin" && !!activeCompany?.id;

  // Seed prevStatusRef when tickets first load
  useEffect(() => {
    if (tickets.length > 0 && Object.keys(prevStatusRef.current).length === 0) {
      const map: Record<string, string> = {};
      tickets.forEach(t => { map[t.id] = t.status; });
      prevStatusRef.current = map;
    }
  }, [tickets, prevStatusRef]);

  const filtered = filterTickets(tickets, filter);
  const activeCount = tickets.filter(t => isActiveStatus(t.status)).length;
  const doneCount = tickets.filter(t => t.status === "completed").length;
  const {
    page,
    setPage,
    pageSize,
    paginatedItems: visibleTickets,
  } = usePagination(filtered, { pageSize: TICKET_PAGE_SIZE, resetKey: filter });

  if (isGuest) {
    return (
      <ProtectedLayout>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-ds-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create an account to submit and track service requests.</p>
          <Button onClick={() => navigate("/auth")} className="gap-2 rounded-ds-md h-11">
            Get Started
          </Button>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isCompanyAdminView ? "Company Tickets" : "My Tickets"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">{tickets.length} total · {activeCount} active · {doneCount} completed</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-500 ${realtimePulse ? "bg-success/20 border-success/40 text-success scale-110" : "bg-success/10 border-success/20 text-success"}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-success ${realtimePulse ? "animate-ping" : "animate-pulse"}`} />
                Live
              </span>
            </div>
          </div>
          <Button onClick={() => navigate(newTicketPath)} className="gap-2 rounded-ds-md h-11 font-semibold">
            <PlusCircle className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {tickets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-primary/5 border border-primary/15 rounded-ds-md flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{activeCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Active</p>
              </div>
            </div>
            <div className="p-3 bg-success/5 border border-success/15 rounded-ds-md flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{doneCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Completed</p>
              </div>
            </div>
            <div className="p-3 bg-accent/5 border border-accent/15 rounded-ds-md flex items-center gap-3">
              <Coins className="h-5 w-5 text-accent flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{tickets.reduce((a, t) => a + (t.credit_cost ?? 0), 0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Credits Used</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map(ft => (
            <button
              key={ft.key}
              onClick={() => setFilter(ft.key)}
              className={`px-4 py-2 rounded-ds-md text-xs font-semibold transition-colors whitespace-nowrap border ${
                filter === ft.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border-subtle hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              {ft.label}
              {ft.key === "active" && activeCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-primary-foreground/20">{activeCount}</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-ds-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-ds-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-ds-xl bg-muted flex items-center justify-center mb-4">
                <ClipboardCheck className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
              </h3>
              <p className="text-muted-foreground text-sm mb-5">
                {filter === "all" ? "Submit your first request to get started." : "Check other filters."}
              </p>
              {filter === "all" && (
                <Button onClick={() => navigate(newTicketPath)} className="gap-2 rounded-ds-md">
                  <PlusCircle className="h-4 w-4" />
                  Create Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isSubscriptionTicket={!!activeSubscription && ticket.company_id === activeSubscription.company_id}
                onClick={() => navigate(`${ticketListPath}/${ticket.id}`)}
              />
            ))}
            <PaginationControls
              page={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="tickets"
              className="mt-2"
            />
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
