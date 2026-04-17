import AdminLayout from "@/components/AdminLayout";
import AddMemberCard from "@/pages/admin/company-members/AddMemberCard";
import CompanySelectorCard from "@/pages/admin/company-members/CompanySelectorCard";
import MembersTableCard from "@/pages/admin/company-members/MembersTableCard";
import RemoveMemberDialog from "@/pages/admin/company-members/RemoveMemberDialog";
import { useAdminCompanyMembersPage } from "@/pages/admin/company-members/useAdminCompanyMembersPage";

export default function AdminCompanyMembersPage() {
  const {
    companyId,
    setCompanyId,
    newUserId,
    setNewUserId,
    newRole,
    setNewRole,
    memberToDelete,
    setMemberToDelete,
    companies,
    companiesLoading,
    memberships,
    membershipsLoading,
    profileByUserId,
    addableProfiles,
    selectedCompany,
    addMemberMutation,
    updateRoleMutation,
    removeMemberMutation,
    openDeleteDialog,
    confirmDelete,
  } = useAdminCompanyMembersPage();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Company Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add users to a company, update their role, or remove access.
          </p>
        </div>

        <CompanySelectorCard
          companyId={companyId}
          companies={companies}
          companiesLoading={companiesLoading}
          onCompanyChange={setCompanyId}
        />

        {selectedCompany && (
          <>
            <AddMemberCard
              selectedCompany={selectedCompany}
              newUserId={newUserId}
              newRole={newRole}
              addableProfiles={addableProfiles}
              isPending={addMemberMutation.isPending}
              onUserChange={setNewUserId}
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
