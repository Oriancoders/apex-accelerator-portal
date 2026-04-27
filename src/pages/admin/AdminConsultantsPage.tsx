import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUserFacingError } from "@/lib/errors";
import { toast } from "sonner";
import { adminDeleteEntity } from "@/lib/admin-delete";

type ConsultantProfile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  credits: number;
};

type TicketRow = { id: string; assigned_consultant_id: string | null; status: string };

type ConsultantsData = { profiles: ConsultantProfile[]; tickets: TicketRow[] };

const EMPTY_CONSULTANTS: ConsultantsData = { profiles: [], tickets: [] };

export default function AdminConsultantsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const deleteConsultantMutation = useMutation({
    mutationFn: async (userId: string) => {
      await adminDeleteEntity({ entityType: "consultant", entityId: userId });
    },
    onSuccess: () => {
      toast.success("Consultant deleted successfully");
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
    (consultants?.tickets ?? []).forEach((t) => {
      const userId = t.assigned_consultant_id;
      if (!userId) return;
      const prev = ticketCounts.get(userId) ?? { total: 0, active: 0 };
      prev.total += 1;
      if (activeStatuses.has(t.status)) prev.active += 1;
      ticketCounts.set(userId, prev);
    });

    const q = search.trim().toLowerCase();
    return (consultants?.profiles ?? [])
      .map((p) => ({
        ...p,
        totalTickets: ticketCounts.get(p.user_id)?.total ?? 0,
        activeTickets: ticketCounts.get(p.user_id)?.active ?? 0,
      }))
      .filter((p) => {
        if (!q) return true;
        return [p.full_name ?? "", p.email ?? "", p.phone ?? ""].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => b.activeTickets - a.activeTickets);
  }, [consultants.profiles, consultants.tickets, search]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Consultants</h1>
            <p className="text-sm text-muted-foreground mt-1">View consultants and their assigned workload.</p>
          </div>
          <div className="w-full sm:w-[340px]">
            <Label htmlFor="consultant-search" className="text-xs text-muted-foreground">Search</Label>
            <Input
              id="consultant-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, phone..."
              className="h-11 rounded-ds-md mt-1"
            />
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
                    {rows.map((c) => (
                      <TableRow key={c.user_id}>
                        <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                        <TableCell className="text-right">{c.activeTickets}</TableCell>
                        <TableCell className="text-right">{c.totalTickets}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteConsultantMutation.isPending}
                            onClick={() => {
                              const ok = window.confirm("Delete this consultant account permanently? This cannot be undone.");
                              if (!ok) return;
                              deleteConsultantMutation.mutate(c.user_id);
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
