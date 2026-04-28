import { UserPlus } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import AddUserDialog from "@/pages/admin/users/AddUserDialog";
import UsersListCard from "@/pages/admin/users/UsersListCard";
import UserDialog from "@/pages/admin/users/UserDialog";
import { useAdminUsersPage } from "@/pages/admin/users/useAdminUsersPage";

export default function AdminUsersPage() {
  const {
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    selectedUser,
    setSelectedUser,
    selectedRole,
    setSelectedRole,
    creditAdjust,
    setCreditAdjust,
    creditReason,
    setCreditReason,
    isAddUserOpen,
    setIsAddUserOpen,
    newUserName,
    setNewUserName,
    newUserEmail,
    setNewUserEmail,
    newUserRole,
    setNewUserRole,
    newUserCommissionPercent,
    setNewUserCommissionPercent,
    users,
    isLoading,
    roleByUserId,
    addUserMutation,
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Manage Users</h1>
            <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
          </div>
          <Button className="h-10 rounded-ds-md gap-2" onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        <UsersListCard
          search={search}
          roleFilter={roleFilter}
          isLoading={isLoading}
          users={filtered}
          roleByUserId={roleByUserId}
          onSearchChange={setSearch}
          onRoleFilterChange={setRoleFilter}
          onOpenUser={setSelectedUser}
          getCompanyLabel={getCompanyLabel}
        />
      </div>

      <AddUserDialog
        open={isAddUserOpen}
        fullName={newUserName}
        email={newUserEmail}
        role={newUserRole}
        commissionPercent={newUserCommissionPercent}
        isPending={addUserMutation.isPending}
        onOpenChange={setIsAddUserOpen}
        onFullNameChange={setNewUserName}
        onEmailChange={setNewUserEmail}
        onRoleChange={setNewUserRole}
        onCommissionPercentChange={setNewUserCommissionPercent}
        onSubmit={() => addUserMutation.mutate()}
      />

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
