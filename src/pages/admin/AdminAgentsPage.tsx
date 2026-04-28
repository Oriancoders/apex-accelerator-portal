import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AgentsTableCard from "@/pages/admin/agents/AgentsTableCard";
import ManageAgentCompaniesDialog from "@/pages/admin/agents/ManageAgentCompaniesDialog";
import RegisterAgentDialog from "@/pages/admin/agents/RegisterAgentDialog";
import { useAdminAgentsPage } from "@/pages/admin/agents/useAdminAgentsPage";

export default function AdminAgentsPage() {
  const {
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
  } = useAdminAgentsPage();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Agent Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Register and manage sales/service agents</p>
          </div>
          <Button className="h-11 rounded-ds-md" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Register Agent
          </Button>
        </div>

        <AgentsTableCard
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          isLoading={isLoading}
          filteredAgents={filteredAgents}
          onManageCompanies={(agent) => {
            setManageAgent(agent);
            setManageOpen(true);
            setAssignCompanyId("");
            setAssignCommissionPercent("");
          }}
          onToggleActive={(agent) => toggleActiveMutation.mutate({ id: agent.id, next: !agent.is_active })}
          onDeleteAgent={(agent) => {
            const ok = window.confirm("Delete this agent and all related assignments/rules? This cannot be undone.");
            if (!ok) return;
            deleteAgentMutation.mutate(agent.id);
          }}
          deletePending={deleteAgentMutation.isPending}
        />
      </div>

      <RegisterAgentDialog
        open={open}
        selectedUserId={selectedUserId}
        commissionPercent={commissionPercent}
        candidateProfiles={candidateProfiles}
        isPending={registerMutation.isPending}
        onOpenChange={setOpen}
        onSelectedUserChange={setSelectedUserId}
        onCommissionPercentChange={setCommissionPercent}
        onCreate={() => registerMutation.mutate()}
      />

      <ManageAgentCompaniesDialog
        open={manageOpen}
        manageAgent={manageAgent}
        assignCompanyId={assignCompanyId}
        assignCommissionPercent={assignCommissionPercent}
        assignableCompanies={assignableCompanies}
        assignments={assignments}
        commissionDraftByAssignment={commissionDraftByAssignment}
        createAssignmentPending={createAssignmentMutation.isPending}
        updateAssignmentStatusPending={updateAssignmentStatusMutation.isPending}
        updateAssignmentCommissionPending={updateAssignmentCommissionMutation.isPending}
        onOpenChange={setManageOpen}
        onAssignCompanyChange={setAssignCompanyId}
        onAssignCommissionPercentChange={setAssignCommissionPercent}
        onAssign={() => createAssignmentMutation.mutate()}
        onAssignmentStatusChange={(args) => updateAssignmentStatusMutation.mutate(args)}
        onCommissionDraftChange={(assignmentId, value) =>
          setCommissionDraftByAssignment((prev) => ({ ...prev, [assignmentId]: value }))
        }
        onSaveAssignmentCommission={(a) =>
          updateAssignmentCommissionMutation.mutate({
            assignmentId: a.id,
            value:
              commissionDraftByAssignment[a.id] ??
              String(a.commission_percent ?? manageAgent?.default_commission_percent ?? 0),
          })
        }
      />
    </AdminLayout>
  );
}
