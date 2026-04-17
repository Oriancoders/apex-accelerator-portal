import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import type { AgentRow, AssignmentRow, CompanyRow, PayoutModel, RuleRow } from "@/pages/admin/agent-assignments/types";

export function useAdminAgentAssignmentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [companyId, setCompanyId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");

  const [ruleCompanyId, setRuleCompanyId] = useState("");
  const [ruleName, setRuleName] = useState("default");
  const [payoutModel, setPayoutModel] = useState<PayoutModel>("percentage");
  const [rulePercent, setRulePercent] = useState("15");
  const [flatAmount, setFlatAmount] = useState("");
  const [priority, setPriority] = useState("100");

  const [editingRule, setEditingRule] = useState<RuleRow | null>(null);
  const [editRuleName, setEditRuleName] = useState("default");
  const [editPayoutModel, setEditPayoutModel] = useState<PayoutModel>("percentage");
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
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const updateAssignmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agent_company_assignments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agent-company-assignments"] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
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
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const toggleRuleActive = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase.from("commission_rules").update({ is_active: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company-commission-rules", ruleCompanyId] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const openEditRule = (rule: RuleRow) => {
    setEditingRule(rule);
    setEditRuleName(rule.rule_name || "default");
    setEditPayoutModel((rule.payout_model as PayoutModel) || "percentage");
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

      const { error } = await supabase.from("commission_rules").update(payload).eq("id", editingRule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission rule updated");
      queryClient.invalidateQueries({ queryKey: ["admin-company-commission-rules", ruleCompanyId] });
      setEditingRule(null);
    },
    onError: () => toast.error("Operation failed. Please try again."),
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
    onError: () => toast.error("Operation failed. Please try again."),
  });

  return {
    companies,
    agents,
    assignments,
    companyRules,
    companyNameById,
    agentNameById,
    companyId,
    setCompanyId,
    agentId,
    setAgentId,
    commissionPercent,
    setCommissionPercent,
    ruleCompanyId,
    setRuleCompanyId,
    ruleName,
    setRuleName,
    payoutModel,
    setPayoutModel,
    rulePercent,
    setRulePercent,
    flatAmount,
    setFlatAmount,
    priority,
    setPriority,
    editingRule,
    setEditingRule,
    editRuleName,
    setEditRuleName,
    editPayoutModel,
    setEditPayoutModel,
    editRulePercent,
    setEditRulePercent,
    editFlatAmount,
    setEditFlatAmount,
    editPriority,
    setEditPriority,
    ruleToDelete,
    setRuleToDelete,
    createAssignment,
    updateAssignmentStatus,
    createCompanyRule,
    toggleRuleActive,
    updateCompanyRule,
    deleteCompanyRule,
    openEditRule,
  };
}
