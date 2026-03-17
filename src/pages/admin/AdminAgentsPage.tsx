import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Search, UserPlus, Shield, Power, PowerOff, Building2, Link2 } from "lucide-react";

type AgentRow = Tables<"agents">;
type ProfileLite = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
type CompanyLite = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
type AssignmentLite = Tables<"agent_company_assignments"> & {
  companies?: Pick<Tables<"companies">, "name" | "slug"> | null;
};

export default function AdminAgentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("15");
  const [manageOpen, setManageOpen] = useState(false);
  const [manageAgent, setManageAgent] = useState<AgentRow | null>(null);
  const [assignCompanyId, setAssignCompanyId] = useState("");
  const [assignCommissionPercent, setAssignCommissionPercent] = useState("");
  const [commissionDraftByAssignment, setCommissionDraftByAssignment] = useState<Record<string, string>>({});

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, user_id, display_name, email, default_commission_percent, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AgentRow[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-agent-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProfileLite[];
    },
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["admin-assignment-companies-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, status")
        .eq("status", "active")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as CompanyLite[];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["admin-agent-assignments-by-agent", manageAgent?.id],
    queryFn: async () => {
      if (!manageAgent?.id) return [];
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select("*, companies:company_id(name, slug)")
        .eq("agent_id", manageAgent.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AssignmentLite[];
    },
    enabled: !!manageAgent?.id,
  });

  const { data: activeAssignments = [] } = useQuery({
    queryKey: ["admin-active-partner-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select("company_id, agent_id")
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
  });

  const candidateProfiles = useMemo(() => {
    const existingIds = new Set(agents.map((a) => a.user_id));
    return profiles.filter((p) => !existingIds.has(p.user_id));
  }, [profiles, agents]);

  const filteredAgents = useMemo(() => {
    const q = search.toLowerCase();
    return agents.filter((a) =>
      (a.display_name || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q)
    );
  }, [agents, search]);

  const activeCompanyIdsForManagedAgent = useMemo(
    () => new Set(assignments.filter((a) => a.status === "active").map((a) => a.company_id)),
    [assignments]
  );

  const activePartnerCompanyIds = useMemo(
    () => new Set(activeAssignments.map((a) => a.company_id)),
    [activeAssignments]
  );

  const assignableCompanies = useMemo(
    () => companies.filter((c) => !activeCompanyIdsForManagedAgent.has(c.id) && !activePartnerCompanyIds.has(c.id)),
    [companies, activeCompanyIdsForManagedAgent, activePartnerCompanyIds]
  );

  const registerMutation = useMutation({
    mutationFn: async () => {
      const profile = profiles.find((p) => p.user_id === selectedUserId);
      if (!profile) throw new Error("Please select a valid user");

      const commission = Number(commissionPercent);
      if (Number.isNaN(commission) || commission < 0 || commission > 100) {
        throw new Error("Commission must be between 0 and 100");
      }

      const { error } = await supabase.from("agents").insert({
        user_id: profile.user_id,
        display_name: profile.full_name,
        email: profile.email,
        default_commission_percent: commission,
        onboarded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agent registered successfully");
      setOpen(false);
      setSelectedUserId("");
      setCommissionPercent("15");
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      queryClient.invalidateQueries({ queryKey: ["admin-agent-candidates"] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("agents")
        .update({ is_active: next })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be signed in");
      if (!manageAgent?.id) throw new Error("Select an agent first");
      if (!assignCompanyId) throw new Error("Select a company");

      const parsed = assignCommissionPercent.trim() === "" ? null : Number(assignCommissionPercent);
      if (parsed !== null && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) {
        throw new Error("Commission must be between 0 and 100");
      }

      const { data: existingActive, error: existingErr } = await supabase
        .from("agent_company_assignments")
        .select("id")
        .eq("company_id", assignCompanyId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (existingErr) throw existingErr;
      if (existingActive) throw new Error("This company already has an active partner");

      const { error } = await supabase.from("agent_company_assignments").insert({
        company_id: assignCompanyId,
        agent_id: manageAgent.id,
        status: "active",
        commission_percent: parsed,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company assigned to agent");
      setAssignCompanyId("");
      setAssignCommissionPercent("");
      queryClient.invalidateQueries({ queryKey: ["admin-agent-assignments-by-agent", manageAgent?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-active-partner-assignments"] });
    },
    onError: (err: Error) => {
      if (err.message.toLowerCase().includes("idx_one_active_partner_per_company") || err.message.toLowerCase().includes("already has an active partner")) {
        toast.error("This company already has an active partner");
        return;
      }
      toast.error("Operation failed. Please try again.");
    },
  });

  const updateAssignmentCommissionMutation = useMutation({
    mutationFn: async ({ assignmentId, value }: { assignmentId: string; value: string }) => {
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        throw new Error("Commission must be between 0 and 100");
      }

      const { error } = await supabase
        .from("agent_company_assignments")
        .update({ commission_percent: parsed })
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission updated");
      queryClient.invalidateQueries({ queryKey: ["admin-agent-assignments-by-agent", manageAgent?.id] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const updateAssignmentStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: "active" | "paused" | "ended" }) => {
      const { error } = await supabase
        .from("agent_company_assignments")
        .update({ status })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assignment status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-agent-assignments-by-agent", manageAgent?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-active-partner-assignments"] });
    },
    onError: (err: Error) => {
      if (err.message.toLowerCase().includes("idx_one_active_partner_per_company")) {
        toast.error("This company already has an active partner");
        return;
      }
      toast.error("Operation failed. Please try again.");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Agent Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Register and manage sales/service agents</p>
          </div>
          <Button className="h-11 rounded-xl" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Register Agent
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">All Agents</CardTitle>
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10 h-11 rounded-xl"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading agents...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{agent.display_name || "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground">{agent.email || "No email"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.is_active ? "default" : "secondary"}>
                            {agent.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => {
                                setManageAgent(agent);
                                setManageOpen(true);
                                setAssignCompanyId("");
                                setAssignCommissionPercent("");
                              }}
                            >
                              <Building2 className="h-4 w-4 mr-1" /> Manage Companies
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => toggleActiveMutation.mutate({ id: agent.id, next: !agent.is_active })}
                            >
                              {agent.is_active ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-1" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-1" /> Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAgents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                          No agents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Register New Agent</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select user account</Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Choose a user...</option>
                {candidateProfiles.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {(p.full_name || "Unnamed")} - {p.email || "No email"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Default commission (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={!selectedUserId || registerMutation.isPending}
              onClick={() => registerMutation.mutate()}
            >
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="rounded-2xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Manage Agent Companies: {manageAgent?.display_name || manageAgent?.email || "Agent"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Company</Label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                  value={assignCompanyId}
                  onChange={(e) => setAssignCompanyId(e.target.value)}
                >
                  <option value="">Select company...</option>
                  {assignableCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Commission %</Label>
                <Input
                  className="h-11 rounded-xl"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={assignCommissionPercent}
                  onChange={(e) => setAssignCommissionPercent(e.target.value)}
                  placeholder="optional"
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                <Button
                  className="h-11 rounded-xl w-full"
                  disabled={!assignCompanyId || createAssignmentMutation.isPending}
                  onClick={() => createAssignmentMutation.mutate()}
                >
                  <Link2 className="h-4 w-4 mr-2" /> Assign
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No company assignments for this agent
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{a.companies?.name || a.company_id}</p>
                          <p className="text-xs text-muted-foreground">{a.companies?.slug || ""}</p>
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-8 rounded-lg border border-input bg-background px-2 text-xs capitalize"
                            value={a.status}
                            onChange={(e) =>
                              updateAssignmentStatusMutation.mutate({
                                assignmentId: a.id,
                                status: e.target.value as "active" | "paused" | "ended",
                              })
                            }
                            disabled={updateAssignmentStatusMutation.isPending}
                          >
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                            <option value="ended">ended</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              className="h-8 w-24 rounded-lg"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={commissionDraftByAssignment[a.id] ?? String(a.commission_percent ?? manageAgent?.default_commission_percent ?? 0)}
                              onChange={(e) =>
                                setCommissionDraftByAssignment((prev) => ({ ...prev, [a.id]: e.target.value }))
                              }
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              disabled={updateAssignmentCommissionMutation.isPending}
                              onClick={() =>
                                updateAssignmentCommissionMutation.mutate({
                                  assignmentId: a.id,
                                  value:
                                    commissionDraftByAssignment[a.id] ??
                                    String(a.commission_percent ?? manageAgent?.default_commission_percent ?? 0),
                                })
                              }
                            >
                              Save
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setManageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
