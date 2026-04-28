import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { adminDeleteEntity } from "@/lib/admin-delete";
import type { AgentRow, AssignmentLite, CompanyLite, ProfileLite } from "@/pages/admin/agents/types";
import { boundedNumberSchema, uuidSchema } from "@/lib/validation";

export type AgentStatusFilter = "all" | "active" | "inactive";

export function useAdminAgentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>("all");
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
    return agents.filter((a) => {
      const matchesSearch =
        (a.display_name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && a.is_active) ||
        (statusFilter === "inactive" && !a.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

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

      const commission = boundedNumberSchema(0, 100).safeParse(commissionPercent);
      if (!commission.success) {
        throw new Error("Commission must be between 0 and 100");
      }

      const { error } = await supabase.from("agents").insert({
        user_id: uuidSchema.parse(profile.user_id),
        display_name: profile.full_name,
        email: profile.email,
        default_commission_percent: commission.data,
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
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase.from("agents").update({ is_active: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await adminDeleteEntity({ entityType: "agent", entityId: agentId });
    },
    onSuccess: (_, agentId) => {
      toast.success("Agent deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      queryClient.invalidateQueries({ queryKey: ["admin-agent-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-active-partner-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-agent-assignments-by-agent", agentId] });

      if (manageAgent?.id === agentId) {
        setManageOpen(false);
        setManageAgent(null);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Operation failed. Please try again.");
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be signed in");
      if (!manageAgent?.id) throw new Error("Select an agent first");
      if (!assignCompanyId) throw new Error("Select a company");

      const parsed =
        assignCommissionPercent.trim() === ""
          ? null
          : boundedNumberSchema(0, 100).safeParse(assignCommissionPercent);
      if (parsed !== null && !parsed.success) {
        throw new Error("Commission must be between 0 and 100");
      }

      const { data: existingActive, error: existingErr } = await supabase
        .from("agent_company_assignments")
        .select("id")
        .eq("company_id", uuidSchema.parse(assignCompanyId))
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (existingErr) throw existingErr;
      if (existingActive) throw new Error("This company already has an active partner");

      const { error } = await supabase.from("agent_company_assignments").insert({
        company_id: uuidSchema.parse(assignCompanyId),
        agent_id: uuidSchema.parse(manageAgent.id),
        status: "active",
        commission_percent: parsed === null ? null : parsed.data,
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
      if (
        err.message.toLowerCase().includes("idx_one_active_partner_per_company") ||
        err.message.toLowerCase().includes("already has an active partner")
      ) {
        toast.error("This company already has an active partner");
        return;
      }
      toast.error("Operation failed. Please try again.");
    },
  });

  const updateAssignmentCommissionMutation = useMutation({
    mutationFn: async ({ assignmentId, value }: { assignmentId: string; value: string }) => {
      const parsed = boundedNumberSchema(0, 100).safeParse(value);
      if (!parsed.success) {
        throw new Error("Commission must be between 0 and 100");
      }

      const { error } = await supabase
        .from("agent_company_assignments")
        .update({ commission_percent: parsed.data })
        .eq("id", uuidSchema.parse(assignmentId));

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission updated");
      queryClient.invalidateQueries({ queryKey: ["admin-agent-assignments-by-agent", manageAgent?.id] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const updateAssignmentStatusMutation = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: string; status: "active" | "paused" | "ended" }) => {
      if (!["active", "paused", "ended"].includes(status)) throw new Error("Invalid status");
      const { error } = await supabase
        .from("agent_company_assignments")
        .update({ status })
        .eq("id", uuidSchema.parse(assignmentId));
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

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    open,
    setOpen,
    selectedUserId,
    setSelectedUserId,
    commissionPercent,
    setCommissionPercent,
    manageOpen,
    setManageOpen,
    manageAgent,
    setManageAgent,
    assignCompanyId,
    setAssignCompanyId,
    assignCommissionPercent,
    setAssignCommissionPercent,
    commissionDraftByAssignment,
    setCommissionDraftByAssignment,
    isLoading,
    filteredAgents,
    candidateProfiles,
    assignableCompanies,
    assignments,
    registerMutation,
    toggleActiveMutation,
    deleteAgentMutation,
    createAssignmentMutation,
    updateAssignmentCommissionMutation,
    updateAssignmentStatusMutation,
  };
}
