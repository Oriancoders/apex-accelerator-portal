import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Search } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { adminDeleteEntity } from "@/lib/admin-delete";
import { getUserFacingError } from "@/lib/errors";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/shared/PaginationControls";

type ConsultantProfile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  credits: number;
};

type TicketRow = { id: string; assigned_consultant_id: string | null; status: string };
type ConsultantWorkloadFilter = "all" | "active" | "available" | "never_assigned";
type ConsultantsData = { profiles: ConsultantProfile[]; tickets: TicketRow[] };

const EMPTY_CONSULTANTS: ConsultantsData = { profiles: [], tickets: [] };
const CONSULTANT_PAGE_SIZE = 5;

export default function AdminConsultantsPage() {
  const [search, setSearch] = useState("");
  const [workloadFilter, setWorkloadFilter] = useState<ConsultantWorkloadFilter>("all");
  const queryClient = useQueryClient();

  const deleteConsultantMutation = useMutation({
    mutationFn: async (userId: string) => {
      await adminDeleteEntity({ entityType: "consultant", entityId: userId });
    },
    onSuccess: () => {
      toast.success("Consultant access removed");
      queryClient.invalidateQueries({ queryKey: ["admin-consultants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Operation failed. Please try again.");
    },
  });

  const { data: consultants = EMPTY_CONSULTANTS, isLoading } = useQuery({
    queryKey: ["admin-consultants"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "consultant");
      if (rolesError) throw rolesError;

      const userIds = (roles ?? []).map((r) => (r as any).user_id as string).filter(Boolean);
      if (!userIds.length) return EMPTY_CONSULTANTS;

      const [{ data: profiles, error: profilesError }, { data: tickets, error: ticketsError }] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id,full_name,email,phone,credits")
          .in("user_id", userIds),
        supabase
          .from("tickets")
          .select("id,assigned_consultant_id,status")
          .in("assigned_consultant_id", userIds),
      ]);

      if (profilesError) throw profilesError;
      if (ticketsError) throw ticketsError;

      return {
        profiles: (profiles as unknown as ConsultantProfile[]) ?? [],
        tickets: (tickets as unknown as TicketRow[]) ?? [],
      } satisfies ConsultantsData;
    },
    onError: (err: unknown) => toast.error(getUserFacingError(err, "Unable to load consultants.")),
    staleTime: 15_000,
  });

  const rows = useMemo(() => {
    const activeStatuses = new Set(["approved", "in_progress", "uat", "under_review"]);
    const ticketCounts = new Map<string, { total: number; active: number }>();

    (consultants?.tickets ?? []).forEach((ticket) => {
      const userId = ticket.assigned_consultant_id;
      if (!userId) return;
      const prev = ticketCounts.get(userId) ?? { total: 0, active: 0 };
      prev.total += 1;
      if (activeStatuses.has(ticket.status)) prev.active += 1;
      ticketCounts.set(userId, prev);
    });

    const query = search.trim().toLowerCase();
    return (consultants?.profiles ?? [])
      .map((profile) => ({
        ...profile,
        totalTickets: ticketCounts.get(profile.user_id)?.total ?? 0,
        activeTickets: ticketCounts.get(profile.user_id)?.active ?? 0,
      }))
      .filter((profile) => {
        const matchesSearch =
          !query ||
          [profile.full_name ?? "", profile.email ?? "", profile.phone ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query);
        const matchesWorkload =
          workloadFilter === "all" ||
          (workloadFilter === "active" && profile.activeTickets > 0) ||
          (workloadFilter === "available" && profile.activeTickets === 0) ||
          (workloadFilter === "never_assigned" && profile.totalTickets === 0);

        return matchesSearch && matchesWorkload;
      })
      .sort((a, b) => b.activeTickets - a.activeTickets);
  }, [consultants.profiles, consultants.tickets, search, workloadFilter]);

  const {
    page,
    setPage,
    pageSize,
    paginatedItems: visibleRows,
  } = usePagination(rows, { pageSize: CONSULTANT_PAGE_SIZE, resetKey: `${search}:${workloadFilter}` });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Consultants</h1>
            <p className="text-sm text-muted-foreground mt-1">View consultants and their assigned workload.</p>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[340px_190px]">
            <div>
              <Label htmlFor="consultant-search" className="text-xs text-muted-foreground">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="consultant-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, email, phone..."
                  className="h-11 rounded-ds-md pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Workload</Label>
              <Select value={workloadFilter} onValueChange={(value) => setWorkloadFilter(value as ConsultantWorkloadFilter)}>
                <SelectTrigger className="mt-1 h-11 rounded-ds-md">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter workload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workloads</SelectItem>
                  <SelectItem value="active">Active Workload</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="never_assigned">Never Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card className="rounded-ds-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Consultant Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-sm text-muted-foreground text-center">Loading consultants...</div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-sm text-muted-foreground text-center">No consultants found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Active Tickets</TableHead>
                      <TableHead className="text-right">Total Tickets</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((consultant) => (
                      <TableRow key={consultant.user_id}>
                        <TableCell className="font-medium">{consultant.full_name || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{consultant.email || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{consultant.phone || "-"}</TableCell>
                        <TableCell className="text-right">{consultant.activeTickets}</TableCell>
                        <TableCell className="text-right">{consultant.totalTickets}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteConsultantMutation.isPending}
                            onClick={() => {
                              const ok = window.confirm("Remove consultant access and unassign their tickets? The user account will remain until deleted from Admin Users.");
                              if (!ok) return;
                              deleteConsultantMutation.mutate(consultant.user_id);
                            }}
                          >
                            Remove Access
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls
                  page={page}
                  totalItems={rows.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  itemLabel="consultants"
                  className="mt-4"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
