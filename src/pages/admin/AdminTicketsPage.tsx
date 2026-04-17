import AdminLayout from "@/components/AdminLayout";
import { useNavigate } from "react-router-dom";
import TicketsHeader from "@/pages/admin/tickets/TicketsHeader";
import TicketsListCard from "@/pages/admin/tickets/TicketsListCard";
import TicketsStatsRow from "@/pages/admin/tickets/TicketsStatsRow";
import { useAdminTicketsPage } from "@/pages/admin/tickets/useAdminTicketsPage";

export default function AdminTicketsPage() {
  const navigate = useNavigate();
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
          onOpenTicket={(ticket) => navigate(`/admin/tickets/${ticket.id}`)}
        />
      </div>
    </AdminLayout>
  );
}
