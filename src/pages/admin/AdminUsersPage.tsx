import AdminLayout from "@/components/AdminLayout";
import UsersListCard from "@/pages/admin/users/UsersListCard";
import UserDialog from "@/pages/admin/users/UserDialog";
import { useAdminUsersPage } from "@/pages/admin/users/useAdminUsersPage";

export default function AdminUsersPage() {
  const {
    search,
    setSearch,
    selectedUser,
    setSelectedUser,
    selectedRole,
    setSelectedRole,
    creditAdjust,
    setCreditAdjust,
    creditReason,
    setCreditReason,
    users,
    isLoading,
    roleByUserId,
    updateRoleMutation,
    deleteUserMutation,
    adjustCreditsMutation,
    filtered,
    getCompanyLabel,
    handleAdjustCredits,
  } = useAdminUsersPage();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Manage Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
        </div>

        <UsersListCard
          search={search}
          isLoading={isLoading}
          users={filtered}
          roleByUserId={roleByUserId}
          onSearchChange={setSearch}
          onOpenUser={setSelectedUser}
          getCompanyLabel={getCompanyLabel}
        />
      </div>

      <UserDialog
        user={selectedUser}
        selectedRole={selectedRole}
        creditAdjust={creditAdjust}
        creditReason={creditReason}
        updateRolePending={updateRoleMutation.isPending}
        adjustCreditsPending={adjustCreditsMutation.isPending}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        onClose={() => setSelectedUser(null)}
        onRoleChange={setSelectedRole}
        onSaveRole={() => {
          if (!selectedUser || !selectedRole) return;
          updateRoleMutation.mutate({
            userId: selectedUser.user_id,
            role: selectedRole,
          });
        }}
        onCreditAdjustChange={setCreditAdjust}
        onCreditReasonChange={setCreditReason}
        onAdjustCredits={handleAdjustCredits}
        deleteUserPending={deleteUserMutation.isPending}
        onDeleteUser={() => {
          if (!selectedUser) return;
          deleteUserMutation.mutate(selectedUser.user_id);
        }}
        getCompanyLabel={getCompanyLabel}
      />
    </AdminLayout>
  );
}
