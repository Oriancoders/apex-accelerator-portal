import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Handshake, Percent, Link2, Settings2, Pencil, Trash2 } from "lucide-react";

type CompanyRow = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
type AgentRow = Pick<Tables<"agents">, "id" | "display_name" | "email" | "default_commission_percent" | "is_active">;
type AssignmentRow = Tables<"agent_company_assignments">;
type RuleRow = Tables<"commission_rules">;

export default function AdminAgentAssignmentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [companyId, setCompanyId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");

  const [ruleCompanyId, setRuleCompanyId] = useState("");
  const [ruleName, setRuleName] = useState("default");
  const [payoutModel, setPayoutModel] = useState<"percentage" | "flat">("percentage");
  const [rulePercent, setRulePercent] = useState("15");
  const [flatAmount, setFlatAmount] = useState("");
  const [priority, setPriority] = useState("100");

  const [editingRule, setEditingRule] = useState<RuleRow | null>(null);
  const [editRuleName, setEditRuleName] = useState("default");
  const [editPayoutModel, setEditPayoutModel] = useState<"percentage" | "flat">("percentage");
  const [editRulePercent, setEditRulePercent] = useState("15");
  const [editFlatAmount, setEditFlatAmount] = useState("");
  const [editPriority, setEditPriority] = useState("100");
  const [ruleToDelete, setRuleToDelete] = useState<RuleRow | null>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ["admin-assignment-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, status")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as CompanyRow[];
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-assignment-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, display_name, email, default_commission_percent, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AgentRow[];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["admin-agent-company-assignments", companyId],
    queryFn: async () => {
      let query = supabase
        .from("agent_company_assignments")
        .select("*")
        .order("created_at", { ascending: false });
      if (companyId) query = query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AssignmentRow[];
    },
  });

  const { data: companyRules = [] } = useQuery({
    queryKey: ["admin-company-commission-rules", ruleCompanyId],
    queryFn: async () => {
      if (!ruleCompanyId) return [];
      const { data, error } = await supabase
        .from("commission_rules")
        .select("*")
        .eq("scope", "company")
        .eq("company_id", ruleCompanyId)
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data || []) as RuleRow[];
    },
    enabled: !!ruleCompanyId,
  });

  const companyNameById = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [companies]);

  const agentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    agents.forEach((a) => {
      map[a.id] = a.display_name || a.email || "Agent";
    });
    return map;
  }, [agents]);

  const createAssignment = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be signed in");
      if (!companyId || !agentId) throw new Error("Select company and agent");

      const duplicate = assignments.find(
        (a) => a.company_id === companyId && a.agent_id === agentId && a.status === "active"
      );
      if (duplicate) throw new Error("This agent is already actively assigned to this company");

      const parsed = commissionPercent ? Number(commissionPercent) : null;
      if (parsed !== null && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) {
        throw new Error("Commission percent must be between 0 and 100");
      }

      const payload: TablesInsert<"agent_company_assignments"> = {
        company_id: companyId,
        agent_id: agentId,
        status: "active",
        commission_percent: parsed,
        created_by: user.id,
      };

      const { error } = await supabase.from("agent_company_assignments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agent assigned to company");
      queryClient.invalidateQueries({ queryKey: ["admin-agent-company-assignments"] });
      setCommissionPercent("");
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const updateAssignmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("agent_company_assignments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agent-company-assignments"] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const createCompanyRule = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be signed in");
      if (!ruleCompanyId) throw new Error("Select company for commission rule");

      const parsedPriority = Number(priority);
      if (Number.isNaN(parsedPriority)) throw new Error("Invalid priority");

      const payload: TablesInsert<"commission_rules"> = {
        scope: "company",
        company_id: ruleCompanyId,
        created_by: user.id,
        rule_name: ruleName || "default",
        payout_model: payoutModel,
        priority: parsedPriority,
        applies_to: ["all"],
        is_active: true,
      };

      if (payoutModel === "percentage") {
        const parsedPercent = Number(rulePercent);
        if (Number.isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
          throw new Error("Rule percent must be between 0 and 100");
        }
        payload.commission_percent = parsedPercent;
        payload.flat_amount = null;
      } else {
        const parsedFlat = Number(flatAmount);
        if (Number.isNaN(parsedFlat) || parsedFlat < 0) {
          throw new Error("Flat amount must be a positive number");
        }
        payload.flat_amount = parsedFlat;
        payload.commission_percent = null;
      }

      const { error } = await supabase.from("commission_rules").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company commission rule created");
      queryClient.invalidateQueries({ queryKey: ["admin-company-commission-rules", ruleCompanyId] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const toggleRuleActive = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase.from("commission_rules").update({ is_active: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company-commission-rules", ruleCompanyId] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const openEditRule = (rule: RuleRow) => {
    setEditingRule(rule);
    setEditRuleName(rule.rule_name || "default");
    setEditPayoutModel((rule.payout_model as "percentage" | "flat") || "percentage");
    setEditRulePercent(String(rule.commission_percent ?? 0));
    setEditFlatAmount(String(rule.flat_amount ?? ""));
    setEditPriority(String(rule.priority ?? 100));
  };

  const updateCompanyRule = useMutation({
    mutationFn: async () => {
      if (!editingRule) throw new Error("Select a rule to edit");

      const parsedPriority = Number(editPriority);
      if (Number.isNaN(parsedPriority)) throw new Error("Invalid priority");

      const payload: TablesUpdate<"commission_rules"> = {
        rule_name: editRuleName || "default",
        payout_model: editPayoutModel,
        priority: parsedPriority,
      };

      if (editPayoutModel === "percentage") {
        const parsedPercent = Number(editRulePercent);
        if (Number.isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
          throw new Error("Rule percent must be between 0 and 100");
        }
        payload.commission_percent = parsedPercent;
        payload.flat_amount = null;
      } else {
        const parsedFlat = Number(editFlatAmount);
        if (Number.isNaN(parsedFlat) || parsedFlat < 0) {
          throw new Error("Flat amount must be a positive number");
        }
        payload.flat_amount = parsedFlat;
        payload.commission_percent = null;
      }

      const { error } = await supabase
        .from("commission_rules")
        .update(payload)
        .eq("id", editingRule.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission rule updated");
      queryClient.invalidateQueries({ queryKey: ["admin-company-commission-rules", ruleCompanyId] });
      setEditingRule(null);
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const deleteCompanyRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commission_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission rule deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-company-commission-rules", ruleCompanyId] });
      setRuleToDelete(null);
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Agent Assignments & Commission Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">Assign agents to companies and manage per-company commission logic.</p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Handshake className="h-4 w-4 text-primary" />
              Assign Agent To Company
            </CardTitle>
            <CardDescription>Create assignment records and optional commission override.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Company</Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Agent</Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              >
                <option value="">Select agent...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {(a.display_name || "Agent")} ({a.email || "no-email"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <Label>Commission % (optional)</Label>
              <Input
                className="h-11 rounded-xl"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                placeholder="e.g. 12.5"
              />
            </div>

            <div className="md:col-span-3 flex items-end justify-end">
              <Button className="h-11 rounded-xl" onClick={() => createAssignment.mutate()}>
                <Link2 className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Existing Assignments</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{companyNameById[a.company_id] || a.company_id}</TableCell>
                    <TableCell>{agentNameById[a.agent_id] || a.agent_id}</TableCell>
                    <TableCell>
                      {a.commission_percent !== null ? (
                        <Badge variant="outline"><Percent className="h-3 w-3 mr-1" />{a.commission_percent}%</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => updateAssignmentStatus.mutate({ id: a.id, status: "active" })}>Activate</Button>
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => updateAssignmentStatus.mutate({ id: a.id, status: "paused" })}>Pause</Button>
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => updateAssignmentStatus.mutate({ id: a.id, status: "ended" })}>End</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No assignments yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Per-Company Commission Rules
            </CardTitle>
            <CardDescription>Define payout logic by company scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Company</Label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                  value={ruleCompanyId}
                  onChange={(e) => setRuleCompanyId(e.target.value)}
                >
                  <option value="">Select company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label>Rule name</Label>
                <Input className="h-11 rounded-xl" value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label>Priority</Label>
                <Input className="h-11 rounded-xl" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label>Payout model</Label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                  value={payoutModel}
                  onChange={(e) => setPayoutModel(e.target.value as "percentage" | "flat")}
                >
                  <option value="percentage">percentage</option>
                  <option value="flat">flat</option>
                </select>
              </div>

              {payoutModel === "percentage" ? (
                <div className="space-y-1.5 md:col-span-1">
                  <Label>Commission %</Label>
                  <Input className="h-11 rounded-xl" type="number" value={rulePercent} onChange={(e) => setRulePercent(e.target.value)} min="0" max="100" step="0.01" />
                </div>
              ) : (
                <div className="space-y-1.5 md:col-span-1">
                  <Label>Flat amount</Label>
                  <Input className="h-11 rounded-xl" type="number" value={flatAmount} onChange={(e) => setFlatAmount(e.target.value)} min="0" step="0.01" />
                </div>
              )}

              <div className="md:col-span-2 flex items-end justify-end">
                <Button className="h-11 rounded-xl" onClick={() => createCompanyRule.mutate()}>Create Rule</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.rule_name}</TableCell>
                      <TableCell>{rule.payout_model}</TableCell>
                      <TableCell>
                        {rule.payout_model === "percentage"
                          ? `${rule.commission_percent ?? 0}%`
                          : `${rule.flat_amount ?? 0} ${rule.currency}`}
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>{rule.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => toggleRuleActive.mutate({ id: rule.id, next: !rule.is_active })}
                        >
                          {rule.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => openEditRule(rule)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-destructive"
                          onClick={() => setRuleToDelete(rule)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ruleCompanyId && companyRules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No company rules yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Edit Commission Rule</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Rule name</Label>
                <Input className="h-11 rounded-xl" value={editRuleName} onChange={(e) => setEditRuleName(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Input className="h-11 rounded-xl" type="number" value={editPriority} onChange={(e) => setEditPriority(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Payout model</Label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                  value={editPayoutModel}
                  onChange={(e) => setEditPayoutModel(e.target.value as "percentage" | "flat")}
                >
                  <option value="percentage">percentage</option>
                  <option value="flat">flat</option>
                </select>
              </div>

              {editPayoutModel === "percentage" ? (
                <div className="space-y-1.5">
                  <Label>Commission %</Label>
                  <Input className="h-11 rounded-xl" type="number" min="0" max="100" step="0.01" value={editRulePercent} onChange={(e) => setEditRulePercent(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Flat amount</Label>
                  <Input className="h-11 rounded-xl" type="number" min="0" step="0.01" value={editFlatAmount} onChange={(e) => setEditFlatAmount(e.target.value)} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setEditingRule(null)}>Cancel</Button>
              <Button className="rounded-xl" onClick={() => updateCompanyRule.mutate()} disabled={updateCompanyRule.isPending}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete commission rule?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Rule
                <span className="font-semibold text-foreground"> {ruleToDelete?.rule_name || "Unnamed"}</span>
                will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (ruleToDelete) {
                    deleteCompanyRule.mutate(ruleToDelete.id);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
