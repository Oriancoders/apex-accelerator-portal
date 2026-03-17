import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Building2, Users, Ticket, Handshake, LayoutGrid, UserPlus, Trash2, UserCog } from "lucide-react";

type MembershipRow = Tables<"company_memberships">;
type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
type VisibilityRow = Tables<"company_component_visibility">;
type AssignmentRow = Tables<"agent_company_assignments"> & {
  agents?: { display_name: string | null; email: string | null; default_commission_percent: number } | null;
};

const ROLES = ["owner", "admin", "member", "billing"] as const;
const ADD_MEMBER_ROLES = ["admin", "member"] as const;

const COMPONENT_KEYS = [
  "ticket_submission",
  "ticket_overview",
  "knowledge_base",
  "recipes",
  "appexchange",
  "news",
  "extensions",
] as const;

function labelFromKey(key: string) {
  return key.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

import { useParams } from "react-router-dom";

export default function CompanySettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuth();
  const {
    isLoading: tenantLoading,
    activeCompany: defaultActive,
    activeMembership: defaultMembership,
    memberships,
    visibilityMap: defaultVisibility,
  } = useAgentTenant();

  // Determine effective company from slug if present, otherwise default
  const activeMembership = useMemo(() => {
    if (slug) {
      return memberships.find(m => m.companies?.slug === slug) || null;
    }
    return defaultMembership;
  }, [slug, memberships, defaultMembership]);

  const activeCompany = activeMembership?.companies || null;

  // Re-fetch visibility if we are overriding the active company
  const { data: overrideVisibility, isLoading: overrideVisLoading } = useQuery({
    queryKey: ["company-component-visibility", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany?.id) return [];
      const { data, error } = await supabase
        .from("company_component_visibility")
        .select("component_key, is_enabled")
        .eq("company_id", activeCompany.id);
      if (error) throw error;
      return (data || []) as VisibilityRow[];
    },
    enabled: !!activeCompany?.id && activeCompany.id !== defaultActive?.id
  });

  const visibilityMap = useMemo(() => {
    if (activeCompany?.id === defaultActive?.id) return defaultVisibility;
    
    const map: Record<string, boolean> = {};
    (overrideVisibility || []).forEach((row) => {
      map[row.component_key] = row.is_enabled;
    });
    return map;
  }, [activeCompany, defaultActive, defaultVisibility, overrideVisibility]);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<(typeof ADD_MEMBER_ROLES)[number]>("member");
  const [memberToDelete, setMemberToDelete] = useState<MembershipRow | null>(null);
  const [commissionDraftByAssignment, setCommissionDraftByAssignment] = useState<Record<string, string>>({});

  const canManage = !isGuest && !!activeCompany;

  // Company members
  const { data: companyMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["company-dash-members", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany?.id) return [];
      const { data, error } = await supabase
        .from("company_memberships")
        .select("id, company_id, user_id, role, is_primary, invited_by, created_at, updated_at")
        .eq("company_id", activeCompany.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MembershipRow[];
    },
    enabled: !!activeCompany?.id,
  });

  const ownerCount = useMemo(() => companyMembers.filter((m) => m.role === "owner").length, [companyMembers]);

  // Profiles for user lookup
  const { data: allProfiles = [] } = useQuery({
    queryKey: ["company-dash-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
    enabled: canManage,
  });

  const profileByUserId = useMemo(() => {
    const map: Record<string, ProfileRow> = {};
    allProfiles.forEach((p) => { map[p.user_id] = p; });
    return map;
  }, [allProfiles]);

  const memberUserIds = useMemo(() => companyMembers.map((m) => m.user_id), [companyMembers]);

  const addableProfiles = useMemo(() => {
    const memberSet = new Set(memberUserIds);
    return allProfiles.filter((p) => !memberSet.has(p.user_id));
  }, [allProfiles, memberUserIds]);

  // Tickets from company members
  const { data: companyTickets = [] } = useQuery({
    queryKey: ["company-dash-tickets", memberUserIds],
    queryFn: async () => {
      if (!memberUserIds.length) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select("id, user_id, status, credit_cost, created_at, title, priority")
        .in("user_id", memberUserIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: memberUserIds.length > 0,
  });

  const ticketStats = useMemo(() => {
    const open = companyTickets.filter((t) =>
      ["submitted", "under_review", "approved", "in_progress", "uat"].includes(t.status)
    );
    return { total: companyTickets.length, open: open.length };
  }, [companyTickets]);

  // Agent assignments for this company
  const { data: agentAssignments = [] } = useQuery({
    queryKey: ["company-dash-agent-assignments", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany?.id) return [];
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select("*, agents:agent_id(display_name, email, default_commission_percent)")
        .eq("company_id", activeCompany.id)
        .eq("status", "active");
      if (error) throw error;
      return (data || []) as AssignmentRow[];
    },
    enabled: !!activeCompany?.id,
  });

  // Component visibility
  const { data: visibilityRows = [], isLoading: visLoading } = useQuery({
    queryKey: ["company-dash-visibility", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany?.id) return [];
      const { data, error } = await supabase
        .from("company_component_visibility")
        .select("id, company_id, component_key, is_enabled, config, updated_by, created_at, updated_at")
        .eq("company_id", activeCompany.id);
      if (error) throw error;
      return (data || []) as VisibilityRow[];
    },
    enabled: !!activeCompany?.id,
  });

  const dashVisibilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    visibilityRows.forEach((r) => { map[r.component_key] = r.is_enabled; });
    return map;
  }, [visibilityRows]);

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompany?.id) throw new Error("No active company");
      const profile = allProfiles.find(
        (p) => (p.email || "").toLowerCase() === newMemberEmail.toLowerCase().trim()
      );
      if (!profile) throw new Error("No registered user found with that email. Ask them to sign up first.");
      const existing = companyMembers.find((m) => m.user_id === profile.user_id);
      if (existing) throw new Error("User is already a member");

      const payload: TablesInsert<"company_memberships"> = {
        company_id: activeCompany.id,
        user_id: profile.user_id,
        role: newMemberRole,
        invited_by: user?.id || null,
      };
      const { error } = await supabase.from("company_memberships").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added — no email verification required");
      setNewMemberEmail("");
      setNewMemberRole("member");
      queryClient.invalidateQueries({ queryKey: ["company-dash-members", activeCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["company-memberships", user?.id] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      const { error } = await supabase.from("company_memberships").update({ role }).eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-dash-members", activeCompany?.id] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("company_memberships").delete().eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      setMemberToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["company-dash-members", activeCompany?.id] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const toggleComponentMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      if (!activeCompany?.id || !canManage) throw new Error("Not allowed");
      const payload: TablesInsert<"company_component_visibility"> = {
        company_id: activeCompany.id,
        component_key: key,
        is_enabled: enabled,
        updated_by: user?.id || null,
      };
      const { error } = await supabase
        .from("company_component_visibility")
        .upsert(payload, { onConflict: "company_id,component_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-dash-visibility", activeCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["company-component-visibility", activeCompany?.id] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  const updateAssignmentCommissionMutation = useMutation({
    mutationFn: async ({ assignmentId, value }: { assignmentId: string; value: string }) => {
      if (!canManage) throw new Error("Not allowed");
      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        throw new Error("Commission must be a number between 0 and 100");
      }

      const { error } = await supabase
        .from("agent_company_assignments")
        .update({ commission_percent: parsed })
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission updated");
      queryClient.invalidateQueries({ queryKey: ["company-dash-agent-assignments", activeCompany?.id] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });

  if (tenantLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading company workspace…</div>
      </ProtectedLayout>
    );
  }

  if (!activeCompany) {
    return (
      <ProtectedLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">No active company</h2>
          <p className="text-sm text-muted-foreground">Create or switch to a company first.</p>
          <Button onClick={() => navigate("/agent/dashboard")}>Go to Agent Dashboard</Button>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {activeCompany.name}
              </h1>
              <Badge variant={activeCompany.status === "active" ? "default" : "secondary"} className="capitalize">
                {activeCompany.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              tenant/{activeCompany.slug}
            </p>
            {memberships.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                {memberships.length} companies — use the navbar switcher to change active company
              </p>
            )}
          </div>
          {canManage && (
            <Button
              variant="outline"
              className="h-11 rounded-xl gap-2"
              onClick={() => navigate("/admin/company-components")}
            >
              <LayoutGrid className="h-4 w-4" /> Component Admin
            </Button>
          )}
        </div>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Users, label: "Members", value: companyMembers.length, color: "text-primary" },
            { icon: Ticket, label: "Total Tickets", value: ticketStats.total, color: "text-accent" },
            { icon: Ticket, label: "Open Tickets", value: ticketStats.open, color: "text-warning" },
            { icon: Handshake, label: "Agents Assigned", value: agentAssignments.length, color: "text-green-500" },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                  <s.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── Members (Add + List) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Add Member */}
            {canManage && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" /> Add Member
                  </CardTitle>
                  <CardDescription>
                    Enter the email of a registered user. They are added instantly — no email verification required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="member@email.com"
                      className="flex-1 h-11 rounded-xl border border-input bg-background px-3 text-sm"
                    />
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as (typeof ADD_MEMBER_ROLES)[number])}
                      className="h-11 rounded-xl border border-input bg-background px-3 text-sm w-full sm:w-32"
                    >
                      <option value="member">member</option>
                      <option value="admin">companyAdmin</option>
                    </select>
                    <Button
                      className="h-11 rounded-xl px-5"
                      disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
                      onClick={() => addMemberMutation.mutate()}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    User must first sign up at /auth. Once their account exists, they can be added here — no separate invitation email is sent.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Members list */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Members ({companyMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
                ) : companyMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No members yet</p>
                ) : (
                  <div className="space-y-2">
                    {companyMembers.map((membership) => {
                      const profile = profileByUserId[membership.user_id];
                      return (
                        <div
                          key={membership.id}
                          className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {profile?.full_name || "Unnamed User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{profile?.email || membership.user_id}</p>
                          </div>
                          {membership.is_primary && (
                            <Badge className="text-[10px] flex-shrink-0">Primary</Badge>
                          )}
                          {canManage ? (
                            <select
                              value={membership.role === "admin" ? "admin" : "member"}
                              onChange={(e) =>
                                updateRoleMutation.mutate({ membershipId: membership.id, role: e.target.value })
                              }
                              className="h-8 rounded-lg border border-input bg-background px-2 text-xs flex-shrink-0"
                              disabled={updateRoleMutation.isPending}
                            >
                              <option value="member">member</option>
                              <option value="admin">companyAdmin</option>
                            </select>
                          ) : (
                            <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">{membership.role}</Badge>
                          )}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 flex-shrink-0"
                              onClick={() => {
                                if (membership.role === "owner" && ownerCount <= 1) {
                                  toast.error("At least one owner must remain");
                                  return;
                                }
                                setMemberToDelete(membership);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tickets */}
            {companyTickets.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" /> Recent Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Title</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyTickets.slice(0, 8).map((t) => (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-foreground truncate max-w-[180px]">{t.title}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="text-[10px] capitalize">{t.status.replace("_", " ")}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">{t.credit_cost ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right sidebar ──────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Component Visibility */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" /> Dashboard Modules
                </CardTitle>
                <CardDescription>
                  {canManage ? "Toggle which modules your team can see." : "Active modules for this company."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {COMPONENT_KEYS.map((key) => {
                  const enabled = dashVisibilityMap[key] ?? true;
                  return (
                    <div key={key} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                      <div>
                        <p className="text-xs font-medium">{labelFromKey(key)}</p>
                      </div>
                      {canManage ? (
                        <Switch
                          checked={enabled}
                          disabled={toggleComponentMutation.isPending || visLoading}
                          onCheckedChange={(checked) => toggleComponentMutation.mutate({ key, enabled: checked })}
                        />
                      ) : (
                        <Badge variant={enabled ? "default" : "secondary"} className="text-[10px]">
                          {enabled ? "On" : "Off"}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Agent Assignments */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-primary" /> Assigned Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agentAssignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No agents assigned yet</p>
                ) : (
                  <div className="space-y-2">
                    {agentAssignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">{a.agents?.display_name || "Assigned Agent"}</p>
                          <p className="text-[10px] text-muted-foreground">{a.agents?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {(a.commission_percent ?? a.agents?.default_commission_percent ?? 0)}%
                          </Badge>
                          {canManage && (
                            <>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-xs"
                                value={commissionDraftByAssignment[a.id] ?? String(a.commission_percent ?? a.agents?.default_commission_percent ?? 0)}
                                onChange={(e) =>
                                  setCommissionDraftByAssignment((prev) => ({ ...prev, [a.id]: e.target.value }))
                                }
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                disabled={updateAssignmentCommissionMutation.isPending}
                                onClick={() =>
                                  updateAssignmentCommissionMutation.mutate({
                                    assignmentId: a.id,
                                    value:
                                      commissionDraftByAssignment[a.id] ??
                                      String(a.commission_percent ?? a.agents?.default_commission_percent ?? 0),
                                  })
                                }
                              >
                                Save
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Remove member confirmation */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(o) => !o && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will lose access to {activeCompany.name}. This action can be undone by re-adding them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => memberToDelete && removeMemberMutation.mutate(memberToDelete.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedLayout>
  );
}
