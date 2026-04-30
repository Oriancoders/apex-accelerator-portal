import AdminLayout from "@/components/AdminLayout";
import CompanyFormDialog from "@/components/admin/CompanyFormDialog";
import AddMemberCard from "@/pages/admin/company-members/AddMemberCard";
import CompanySelectorCard from "@/pages/admin/company-members/CompanySelectorCard";
import MembersTableCard from "@/pages/admin/company-members/MembersTableCard";
import RemoveMemberDialog from "@/pages/admin/company-members/RemoveMemberDialog";
import { useAdminCompanyMembersPage } from "@/pages/admin/company-members/useAdminCompanyMembersPage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminCompanyMembersPage() {
  const {
    companyId,
    setCompanyId,
    newMemberName,
    setNewMemberName,
    newMemberEmail,
    setNewMemberEmail,
    newRole,
    setNewRole,
    memberToDelete,
    setMemberToDelete,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    companies,
    companiesLoading,
    memberships,
    membershipsLoading,
    profileByUserId,
    selectedCompany,
    selectedCompanyAgent,
    selectedCompanySubscription,
    createCompanyMutation,
    addMemberMutation,
    updateRoleMutation,
    removeMemberMutation,
    deleteCompanyMutation,
    openDeleteDialog,
    confirmDelete,
  } = useAdminCompanyMembersPage();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Company Access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage people, partner ownership, and subscription context for each company.
          </p>
        </div>

        <CompanySelectorCard
          companyId={companyId}
          companies={companies}
          companiesLoading={companiesLoading}
          selectedCompany={selectedCompany}
          selectedCompanyAgent={selectedCompanyAgent}
          selectedCompanySubscription={selectedCompanySubscription}
          deleteCompanyPending={deleteCompanyMutation.isPending}
          onCompanyChange={setCompanyId}
          onDeleteCompany={(targetCompanyId) => {
            const ok = window.confirm("Delete this company and detach its memberships, partner assignments, subscriptions, and ticket links? User accounts will remain.");
            if (!ok) return;
            deleteCompanyMutation.mutate(targetCompanyId);
          }}
        />

        <div className="rounded-ds-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Create Company</h2>
              <p className="text-sm text-muted-foreground mt-1">Fill in all company details including business info, address, and contact information.</p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New Company
            </Button>
          </div>
        </div>

        <CompanyFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={(data) => createCompanyMutation.mutate(data)}
          isLoading={createCompanyMutation.isPending}
        />

        {selectedCompany && (
          <>
            <AddMemberCard
              selectedCompany={selectedCompany}
              newMemberName={newMemberName}
              newMemberEmail={newMemberEmail}
              newRole={newRole}
              isPending={addMemberMutation.isPending}
              onNameChange={setNewMemberName}
              onEmailChange={setNewMemberEmail}
              onRoleChange={setNewRole}
              onAdd={() => addMemberMutation.mutate()}
            />

            <MembersTableCard
              selectedCompany={selectedCompany}
              memberships={memberships}
              membershipsLoading={membershipsLoading}
              profileByUserId={profileByUserId}
              updateRolePending={updateRoleMutation.isPending}
              onRoleChange={(args) => updateRoleMutation.mutate(args)}
              onRemoveClick={openDeleteDialog}
            />
          </>
        )}

        <RemoveMemberDialog
          open={!!memberToDelete}
          isPending={removeMemberMutation.isPending}
          onOpenChange={(open) => {
            if (!open) {
              setMemberToDelete(null);
            }
          }}
          onConfirm={confirmDelete}
        />
      </div>
    </AdminLayout>
  );
}
