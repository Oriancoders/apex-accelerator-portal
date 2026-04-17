import AdminLayout from "@/components/AdminLayout";
import AssignmentFormCard from "@/pages/admin/agent-assignments/AssignmentFormCard";
import AssignmentsTableCard from "@/pages/admin/agent-assignments/AssignmentsTableCard";
import CommissionRulesCard from "@/pages/admin/agent-assignments/CommissionRulesCard";
import DeleteRuleDialog from "@/pages/admin/agent-assignments/DeleteRuleDialog";
import EditRuleDialog from "@/pages/admin/agent-assignments/EditRuleDialog";
import { useAdminAgentAssignmentsPage } from "@/pages/admin/agent-assignments/useAdminAgentAssignmentsPage";

export default function AdminAgentAssignmentsPage() {
  const {
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
  } = useAdminAgentAssignmentsPage();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Agent Assignments & Commission Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">Assign agents to companies and manage per-company commission logic.</p>
        </div>

        <AssignmentFormCard
          companies={companies}
          agents={agents}
          companyId={companyId}
          agentId={agentId}
          commissionPercent={commissionPercent}
          onCompanyChange={setCompanyId}
          onAgentChange={setAgentId}
          onCommissionPercentChange={setCommissionPercent}
          onCreate={() => createAssignment.mutate()}
        />

        <AssignmentsTableCard
          assignments={assignments}
          companyNameById={companyNameById}
          agentNameById={agentNameById}
          onUpdateStatus={(args) => updateAssignmentStatus.mutate(args)}
        />

        <CommissionRulesCard
          companies={companies}
          ruleCompanyId={ruleCompanyId}
          ruleName={ruleName}
          payoutModel={payoutModel}
          rulePercent={rulePercent}
          flatAmount={flatAmount}
          priority={priority}
          companyRules={companyRules}
          onRuleCompanyChange={setRuleCompanyId}
          onRuleNameChange={setRuleName}
          onPayoutModelChange={setPayoutModel}
          onRulePercentChange={setRulePercent}
          onFlatAmountChange={setFlatAmount}
          onPriorityChange={setPriority}
          onCreateRule={() => createCompanyRule.mutate()}
          onToggleRuleActive={(args) => toggleRuleActive.mutate(args)}
          onEditRule={openEditRule}
          onDeleteRule={setRuleToDelete}
        />

        <EditRuleDialog
          editingRule={editingRule}
          editRuleName={editRuleName}
          editPriority={editPriority}
          editPayoutModel={editPayoutModel}
          editRulePercent={editRulePercent}
          editFlatAmount={editFlatAmount}
          isSaving={updateCompanyRule.isPending}
          onOpenChange={(open) => !open && setEditingRule(null)}
          onEditRuleNameChange={setEditRuleName}
          onEditPriorityChange={setEditPriority}
          onEditPayoutModelChange={setEditPayoutModel}
          onEditRulePercentChange={setEditRulePercent}
          onEditFlatAmountChange={setEditFlatAmount}
          onSave={() => updateCompanyRule.mutate()}
        />

        <DeleteRuleDialog
          ruleToDelete={ruleToDelete}
          onOpenChange={(open) => !open && setRuleToDelete(null)}
          onDelete={(id) => deleteCompanyRule.mutate(id)}
        />
      </div>
    </AdminLayout>
  );
}
