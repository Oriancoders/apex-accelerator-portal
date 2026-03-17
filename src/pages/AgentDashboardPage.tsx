import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import {
  Building2, ArrowRight, Percent, TrendingUp, Ticket,
  Users, DollarSign, CalendarDays, Plus, Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AgentCompanyAssignment = Tables<"agent_company_assignments"> & {
  companies?: Pick<Tables<"companies">, "name" | "slug"> | Pick<Tables<"companies">, "name" | "slug">[] | null;
};
type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;

const PERIODS = [
  { label: "Today", days: 0 },
  { label: "3 Days", days: 3 },
  { label: "7 Days", days: 7 },
  { label: "1 Month", days: 30 },
] as const;

function daysAgo(days: number): string {
  const d = new Date();
  if (days === 0) d.setHours(0, 0, 0, 0);
  else d.setDate(d.getDate() - days);
  return d.toISOString();
}

function fmtCredits(n: number | string | null | undefined): string {
  // Convert any string to number, handle null/undefined
  const val = Number(n);
  if (isNaN(val) || val === 0) return "0";
  
  // Use en-US to ensure standard millions/billions format
  // Show up to 2 decimal places if needed (e.g. 1.5 credits)
  return val.toLocaleString("en-US", { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  });
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAgent, agent, memberships, activeCompany, isLoading } = useAgentTenant();
  const [periodIdx, setPeriodIdx] = useState(2); // default 7 days
  const [expandCompanyId, setExpandCompanyId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Create Company State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanySlug, setNewCompanySlug] = useState("");

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");

  // Agent's company assignments (commission %)
  const { data: assignments = [] } = useQuery({
    queryKey: ["agent-assignments", agent?.id],
    queryFn: async () => {
      if (!agent?.id) return [];
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select(`
          company_id,
          commission_percent,
          status,
          companies:companies!inner(name, slug)
        `)
        .eq("agent_id", agent.id)
        .eq("status", "active");
      if (error) {
        console.error("Error fetching assignments:", error);
        return [];
      }
      return (data || []) as AgentCompanyAssignment[];
    },
    enabled: !!agent?.id,
  });

  const companyIds = useMemo(() => {
    const fromMemberships = memberships.map((m) => m.company_id);
    const fromAssignments = assignments.map((a) => a.company_id);
    return Array.from(new Set([...fromMemberships, ...fromAssignments]));
  }, [memberships, assignments]);

  const commissionForCompany = useMemo(() => {
    const map: Record<string, number> = {};
    assignments.forEach((a) => {
      map[a.company_id] = a.commission_percent ?? agent?.default_commission_percent ?? 0;
    });
    return map;
  }, [assignments, agent]);

  const allCompanies = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();

    // From memberships
    memberships.forEach((m) => {
      if (m.companies) {
        map.set(m.company_id, {
          id: m.company_id,
          name: m.companies.name,
          slug: m.companies.slug,
        });
      }
    });

    // From assignments
    assignments.forEach((a) => {
      // @ts-ignore - companies join is manual in query
      if (a.companies && !map.has(a.company_id)) {
        // @ts-ignore
        const companyName = Array.isArray(a.companies) ? a.companies[0]?.name : a.companies?.name;
        // @ts-ignore
        const companySlug = Array.isArray(a.companies) ? a.companies[0]?.slug : a.companies?.slug;

        map.set(a.company_id, {
          id: a.company_id,
          name: companyName || "Unknown Company",
          slug: companySlug || "",
        });
      }
    });

    return Array.from(map.values());
  }, [memberships, assignments]);

  // All company members across all agent companies
  const { data: allCompanyMembers = [] } = useQuery({
    queryKey: ["agent-all-company-members", companyIds],
    queryFn: async () => {
      if (!companyIds.length) return [];
      const { data, error } = await supabase
        .from("company_memberships")
        .select("company_id, user_id")
        .in("company_id", companyIds);
      if (error) {
        console.error("Error fetching company members:", error);
        return [];
      }
      return (data || []) as { company_id: string; user_id: string }[];
    },
    enabled: companyIds.length > 0,
  });

  const allMemberUserIds = useMemo(
    () => [...new Set(allCompanyMembers.map((m) => m.user_id))],
    [allCompanyMembers]
  );

  // Keep a stable selected company for focused stats/tickets view.
  useEffect(() => {
    if (!allCompanies.length) {
      setSelectedCompanyId(null);
      return;
    }

    // Keep explicit "all companies" mode when selected.
    if (selectedCompanyId === null) return;

    const preferredId = activeCompany?.id || allCompanies[0].id;
    const exists = allCompanies.some((c) => c.id === selectedCompanyId);
    if (!exists) {
      setSelectedCompanyId(preferredId);
    }
  }, [allCompanies, activeCompany?.id, selectedCompanyId]);

  // Member counts per company
  const memberCountByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    allCompanyMembers.forEach((m) => {
      map[m.company_id] = (map[m.company_id] || 0) + 1;
    });
    return map;
  }, [allCompanyMembers]);

  const primaryCompanyByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    allCompanyMembers.forEach((m) => {
      if (!map[m.user_id]) map[m.user_id] = m.company_id;
    });
    return map;
  }, [allCompanyMembers]);

  // Profile lookup for member add
  const { data: allProfiles = [] } = useQuery({
    queryKey: ["agent-dashboard-profiles", allMemberUserIds],
    queryFn: async () => {
      if (!allMemberUserIds.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", allMemberUserIds)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }
      return (data || []) as ProfileRow[];
    },
    enabled: allMemberUserIds.length > 0,
  });

  // All tickets from company members (using company_id or user_id fallback)
  const { data: allTickets = [] } = useQuery({
    queryKey: ["agent-company-tickets", companyIds, allMemberUserIds],
    queryFn: async () => {
      if (!companyIds.length && !allMemberUserIds.length) return [];

      // Build OR conditions dynamically to avoid invalid filters like user_id.in.()
      const filters: string[] = [];
      if (companyIds.length) filters.push(`company_id.in.(${companyIds.join(",")})`);
      if (allMemberUserIds.length) filters.push(`user_id.in.(${allMemberUserIds.join(",")})`);

      // First try to fetch by company_id, falling back to user_id for older tickets
      const { data, error } = await supabase
        .from("tickets")
        // @ts-ignore - company_id might not be in types yet
        .select("id, user_id, company_id, status, credit_cost, created_at, title, priority")
        // @ts-ignore
        .or(filters.join(","))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        return [];
      }
      return data || [];
    },
    enabled: companyIds.length > 0 || allMemberUserIds.length > 0,
  });

  // Period-filtered stats
  const periodStats = useMemo(() => {
    // Map user_id to company_id based on allCompanyMembers as fallback
    const userCompanyMap: Record<string, string> = {};
    allCompanyMembers.forEach((m) => {
      userCompanyMap[m.user_id] = m.company_id;
    });

    const getCommission = (ticket: any) => {
      // Primary: Use company_id on ticket
      // @ts-ignore
      let cid = ticket.company_id;
      // Secondary: Fallback to user membership lookup
      if (!cid) cid = userCompanyMap[ticket.user_id];
      
      if (!cid) return Number(agent?.default_commission_percent ?? 0);
      
      const comm = commissionForCompany[cid] ?? agent?.default_commission_percent ?? 0;
      return Number(comm);
    };

    const period = PERIODS[periodIdx];
    const cutoff = daysAgo(period.days);
    const inPeriod = allTickets.filter((t) => t.created_at >= cutoff);
    const resolved = inPeriod.filter((t) => t.status === "resolved" || t.status === "completed");
    const open = allTickets.filter((t) =>
      ["submitted", "under_review", "approved", "in_progress", "uat"].includes(t.status)
    );
    
    // Calculate earned by summing (credits * commission%) for EACH resolved ticket
    const earned = resolved.reduce((acc, t) => {
      const comm = getCommission(t);
      // Ensure credit_cost is a number
      const cost = Number(t.credit_cost ?? 0);
      return acc + (cost * (comm / 100));
    }, 0);

    const creditsConsumed = resolved.reduce((acc, t) => acc + Number(t.credit_cost ?? 0), 0);
    
    // Calculate potential similarly
    const potential = open.reduce((acc, t) => {
      const comm = getCommission(t);
      const cost = Number(t.credit_cost ?? 0);
      return acc + (cost * (comm / 100));
    }, 0);

    return {
      total: inPeriod.length,
      resolved: resolved.length,
      creditsConsumed,
      earned,
      openCount: open.length,
      potential,
    };
  }, [allTickets, periodIdx, agent, allCompanyMembers, commissionForCompany]);

  // Per-company stats
  const companyStats = useMemo(() => {
    const map: Record<string, { tickets: number; openTickets: number; creditsConsumed: number; earned: number; potential: number }> = {};
    allCompanies.forEach((c) => {
      const tickets = allTickets.filter((t) => {
         // @ts-ignore
         if (t.company_id === c.id) return true;
         // Fallback: check if user is a member of this company
         const membership = allCompanyMembers.find(m => m.user_id === t.user_id && m.company_id === c.id);
         return !!membership;
      });

      const open = tickets.filter((t) =>
        ["submitted", "under_review", "approved", "in_progress", "uat"].includes(t.status)
      );
      const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "completed");
      
      const comm = Number(commissionForCompany[c.id] ?? agent?.default_commission_percent ?? 0);
      const creditsConsumed = resolved.reduce((acc, t) => acc + Number(t.credit_cost ?? 0), 0);
      
      const earned = creditsConsumed * (comm / 100);
      const potential = open.reduce((acc, t) => acc + Number(t.credit_cost ?? 0), 0) * (comm / 100);
      
      map[c.id] = {
        tickets: tickets.length,
        openTickets: open.length,
        creditsConsumed,
        earned,
        potential,
      };
    });
    return map;
  }, [allCompanies, allCompanyMembers, allTickets, commissionForCompany, agent]);

  const focusedCompany = useMemo(
    () => allCompanies.find((c) => c.id === selectedCompanyId) || null,
    [allCompanies, selectedCompanyId]
  );

  const focusedStats = useMemo(
    () => (focusedCompany ? companyStats[focusedCompany.id] || { tickets: 0, openTickets: 0, creditsConsumed: 0, earned: 0, potential: 0 } : null),
    [focusedCompany, companyStats]
  );

  const focusedTickets = useMemo(() => {
    if (!focusedCompany) return allTickets;
    return allTickets.filter((t) => {
      // @ts-ignore - company_id may not be in generated types yet
      const ticketCompanyId = t.company_id || primaryCompanyByUserId[t.user_id];
      return ticketCompanyId === focusedCompany.id;
    });
  }, [focusedCompany, allTickets, primaryCompanyByUserId]);

  // Create Company Mutation
  const createCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!user || !agent) throw new Error("Agent session not found");

      const payload: TablesInsert<"companies"> = {
        name: newCompanyName.trim(),
        slug: newCompanySlug.trim(),
        status: "active",
        created_by: user.id,
        created_via_agent_id: agent.id,
      };

      const { error } = await supabase.from("companies").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company created successfully");
      setNewCompanyName("");
      setNewCompanySlug("");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["company-memberships", user?.id] });
    },
    onError: (err: Error) => {
      if (err.message.toLowerCase().includes("duplicate") || err.message.toLowerCase().includes("unique")) {
        toast.error("Company slug already exists. Try a different slug.");
      } else {
        toast.error(err.message);
      }
    },
  });

  // Add member to a company (no email verification — direct profile lookup)
  const addMemberMutation = useMutation({
    mutationFn: async ({ companyId }: { companyId: string }) => {
      const profile = allProfiles.find(
        (p) => (p.email || "").toLowerCase() === newMemberEmail.toLowerCase().trim()
      );
      if (!profile) throw new Error("No registered user found with that email. Ask them to create an account first.");
      const existing = allCompanyMembers.find(
        (m) => m.company_id === companyId && m.user_id === profile.user_id
      );
      if (existing) throw new Error("User is already a member of this company");
      const payload: TablesInsert<"company_memberships"> = {
        company_id: companyId,
        user_id: profile.user_id,
        role: newMemberRole,
        invited_by: user?.id || null,
      };
      const { error } = await supabase.from("company_memberships").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_, { companyId }) => {
      toast.success("Member added successfully");
      setNewMemberEmail("");
      setNewMemberRole("member");
      queryClient.invalidateQueries({ queryKey: ["agent-all-company-members", companyIds] });
      queryClient.invalidateQueries({ queryKey: ["company-memberships-manage", companyId] });
      // Invalidate tickets so any newly 'claimed' tickets appear immediately
      queryClient.invalidateQueries({ queryKey: ["agent-company-tickets"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading agent workspace…</div>
      </ProtectedLayout>
    );
  }

  if (!isAgent) {
    return (
      <ProtectedLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <p className="text-muted-foreground">You don't have an agent profile.</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Agent Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {agent?.display_name || agent?.email}
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company workspace. You will be assigned as the Owner.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={newCompanyName}
                    onChange={(e) => {
                      setNewCompanyName(e.target.value);
                      if (!newCompanySlug && e.target.value) {
                         setNewCompanySlug(toSlug(e.target.value));
                      }
                    }}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={newCompanySlug}
                    onChange={(e) => setNewCompanySlug(toSlug(e.target.value))}
                    placeholder="acme-corp"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Unique identifier for the company URLs.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createCompanyMutation.mutate()}
                  disabled={createCompanyMutation.isPending || !newCompanyName.trim() || !newCompanySlug.trim()}
                >
                  {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Period Selector ────────────────────────────────────────── */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
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

        {/* ── Stats Cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Ticket, label: "Tickets", value: periodStats.total, sub: `${periodStats.resolved} resolved`, color: "text-primary" },
            { icon: CalendarDays, label: "Credits Consumed", value: fmtCredits(periodStats.creditsConsumed), sub: "from resolved tickets", color: "text-accent" },
            { icon: DollarSign, label: "Earned Commission", value: fmtCredits(periodStats.earned), sub: "Based on company rates", color: "text-green-500" },
            { icon: TrendingUp, label: "Potential Income", value: fmtCredits(periodStats.potential), sub: `${periodStats.openCount} open tickets`, color: "text-warning" },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl">
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

        {/* ── No companies yet ──────────────────────────────────────── */}
        {allCompanies.length === 0 && (
          <Card className="rounded-2xl border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-base">No companies yet</CardTitle>
              <CardDescription>Create your first company workspace to unlock commission tracking and client ticket monitoring.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="h-11 rounded-xl" onClick={() => setIsCreateOpen(true)}>
                Create First Company <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── My Companies ─────────────────────────────────────────── */}
        {allCompanies.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">My Companies</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {allCompanies.map((c) => {
                const membership = memberships.find(m => m.company_id === c.id);
                const assignment = assignments.find(a => a.company_id === c.id);
                const stats = companyStats[c.id] || { tickets: 0, openTickets: 0, creditsConsumed: 0, earned: 0, potential: 0 };
                const comm = assignment?.commission_percent ?? agent?.default_commission_percent ?? 0;
                
                const isExpanded = expandCompanyId === c.id;
                const isPrimary = activeCompany?.id === c.id;

                return (
                  <Card key={c.id} className={`rounded-2xl transition-all ${isPrimary ? "border-primary/40 bg-primary/5" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <div>
                            <CardTitle className="text-sm font-semibold">{c.name || c.id}</CardTitle>
                            <p className="text-[11px] text-muted-foreground">{c.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isPrimary && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Primary</Badge>
                          )}
                          {!membership && (
                            <Badge variant="outline" className="text-[10px]">Agent Only</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/50 py-2">
                          <p className="text-lg font-bold text-foreground">{memberCountByCompany[c.id] || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Members</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 py-2">
                          <p className="text-lg font-bold text-foreground">{stats.tickets}</p>
                          <p className="text-[10px] text-muted-foreground">Tickets</p>
                        </div>
                          <div className="rounded-lg bg-muted/50 py-2">
                            <p className="text-lg font-bold text-primary">{comm}%</p>
                            <p className="text-[10px] text-muted-foreground">Commission</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
                          <span>Potential: <span className="text-warning font-semibold">{fmtCredits(stats.potential)} Credits</span></span>
                          <span>Earned: <span className="text-green-500 font-semibold">{fmtCredits(stats.earned)} Credits</span></span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant={selectedCompanyId === c.id ? "default" : "outline"}
                            size="sm"
                            className="flex-1 rounded-lg text-xs h-8"
                            onClick={() => setSelectedCompanyId(c.id)}
                          >
                            Focus
                          </Button>
                          {membership && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-lg text-xs h-8"
                              onClick={() => navigate(`/${c.slug}/dashboard`)}
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                          )}
                          <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-lg text-xs h-8"
                          onClick={() => setExpandCompanyId(isExpanded ? null : c.id)}
                        >
                          <Users className="h-3 w-3 mr-1" /> {isExpanded ? "Close" : "Members"}
                        </Button>
                      </div>

                      {/* Inline add member panel */}
                      {isExpanded && (
                        <div className="border-t border-border pt-3 space-y-2">
                          <p className="text-xs font-medium text-foreground">Add Member</p>
                          <input
                            type="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            placeholder="Member email address"
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                          />
                          <div className="flex gap-2">
                            <select
                              value={newMemberRole}
                              onChange={(e) => setNewMemberRole(e.target.value as typeof newMemberRole)}
                              className="flex-1 h-9 rounded-lg border border-input bg-background px-2 text-xs"
                            >
                              <option value="member">member</option>
                              <option value="admin">companyAdmin</option>
                            </select>
                            <Button
                              size="sm"
                              className="h-9 rounded-lg text-xs"
                              disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
                              onClick={() => addMemberMutation.mutate({ companyId: c.id })}
                            >
                              Add
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            User must already have an account. Added instantly — no email verification required.
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs p-0 h-auto"
                            onClick={() => navigate("/company/members")}
                          >
                            Manage all members →
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Focused Company View ─────────────────────────────────── */}
        {focusedCompany && focusedStats && (
          <Card className="rounded-2xl border-primary/25 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Focused Company: {focusedCompany.name}</CardTitle>
                  <CardDescription>Stats and tickets below are scoped to this company.</CardDescription>
                </div>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-2 text-xs min-w-[220px]"
                  value={focusedCompany?.id || "__all__"}
                  onChange={(e) => setSelectedCompanyId(e.target.value === "__all__" ? null : e.target.value)}
                >
                  <option value="__all__">All Companies</option>
                  {allCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-background/70 border border-border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Tickets</p>
                  <p className="text-xl font-semibold text-foreground">{focusedStats.tickets}</p>
                </div>
                <div className="rounded-xl bg-background/70 border border-border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Open</p>
                  <p className="text-xl font-semibold text-warning">{focusedStats.openTickets}</p>
                </div>
                <div className="rounded-xl bg-background/70 border border-border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Potential</p>
                  <p className="text-xl font-semibold text-primary">{fmtCredits(focusedStats.potential)}</p>
                </div>
                <div className="rounded-xl bg-background/70 border border-border px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">Earned</p>
                  <p className="text-xl font-semibold text-green-500">{fmtCredits(focusedStats.earned)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Recent Tickets ───────────────────────────────────────── */}
        {focusedTickets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Tickets {focusedCompany ? `- ${focusedCompany.name}` : ""}
              </h2>
              <span className="text-xs text-muted-foreground">
                {focusedCompany ? "From selected company" : "From your company members"}
              </span>
            </div>
            <Card className="rounded-2xl">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">User / Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Priority</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {focusedTickets.slice(0, 10).map((t) => {
                      const profile = allProfiles.find((p) => p.user_id === t.user_id);
                      const membership = allCompanyMembers.find((m) => m.user_id === t.user_id);
                      const company = membership ? allCompanies.find((c) => c.id === membership.company_id) : null;
                      
                      return (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground truncate max-w-[200px]">{t.title}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{profile?.full_name || "Unknown User"}</span>
                              <span className="text-[10px] text-muted-foreground">{company?.name || "Unknown Company"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] capitalize">{t.status.replace("_", " ")}</Badge>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant="secondary" className="text-[10px] capitalize">{t.priority}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {t.credit_cost != null ? fmtCredits(t.credit_cost) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </ProtectedLayout>
  );
}
