import { useMemo, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useCompanyMemberships, useAllProfiles } from "./hooks/useMembershipQueries";
import { useAddMemberMutation, useUpdateRoleMutation, useRemoveMemberMutation } from "./hooks/useMembershipMutations";
import { buildProfileByUserIdMap, getMemberUserIds, getAddableProfiles, getOwnerCount } from "./utils";
import { NoCompanyCard } from "./components/NoCompanyCard";
import { ActiveCompanyCard } from "./components/ActiveCompanyCard";
import { AddMemberSection } from "./components/AddMemberSection";
import { MembersTableSection } from "./components/MembersTableSection";
import { RemoveConfirmDialog } from "./components/RemoveConfirmDialog";
import { ADD_MEMBER_ROLES } from "./constants";
import type { MembershipRow, AddMemberRole } from "./types";

export default function CompanyMembersPage() {
  const { user } = useAuth();
  const { activeCompany } = useAgentTenant();

  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AddMemberRole>("member");
  const [memberToDelete, setMemberToDelete] = useState<MembershipRow | null>(null);

  const canManage = !!activeCompany;

  const { data: memberships = [], isLoading: membershipsLoading } = useCompanyMemberships(activeCompany?.id);
  const { data: allProfiles = [] } = useAllProfiles(canManage);

  const profileByUserId = useMemo(() => buildProfileByUserIdMap(allProfiles), [allProfiles]);
  const memberUserIds = useMemo(() => getMemberUserIds(memberships), [memberships]);
  const addableProfiles = useMemo(() => getAddableProfiles(allProfiles, memberUserIds), [allProfiles, memberUserIds]);
  const ownerCount = useMemo(() => getOwnerCount(memberships), [memberships]);

  const addMemberMutation = useAddMemberMutation(activeCompany?.id);
  const updateRoleMutation = useUpdateRoleMutation(activeCompany?.id);
  const removeMemberMutation = useRemoveMemberMutation(activeCompany?.id);

  const handleAddMember = () => {
    if (!activeCompany?.id || !user?.id) return;
    addMemberMutation.mutate({
      company_id: activeCompany.id,
      user_id: newUserId,
      role: newRole,
      invited_by: user.id,
    });
    setNewUserId("");
    setNewRole("member");
  };

  const handleRemoveMember = () => {
    if (!memberToDelete) return;
    removeMemberMutation.mutate(memberToDelete.id);
    setMemberToDelete(null);
  };

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto space-y-5 py-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Company Access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who can access your currently active company workspace.
          </p>
        </div>

        {!activeCompany && <NoCompanyCard />}

        {activeCompany && (
          <>
            <ActiveCompanyCard name={activeCompany.name} slug={activeCompany.slug} />

            {canManage && (
              <>
                <AddMemberSection
                  newUserId={newUserId}
                  setNewUserId={setNewUserId}
                  newRole={newRole}
                  setNewRole={setNewRole}
                  addableProfiles={addableProfiles}
                  mutation={addMemberMutation}
                  onSubmit={handleAddMember}
                />

                <MembersTableSection
                  memberships={memberships}
                  profileByUserId={profileByUserId}
                  isLoading={membershipsLoading}
                  ownerCount={ownerCount}
                  updateRoleMutation={updateRoleMutation}
                  onDeleteClick={setMemberToDelete}
                />
              </>
            )}
          </>
        )}

        <RemoveConfirmDialog
          memberToDelete={memberToDelete}
          onOpenChange={setMemberToDelete}
          onConfirm={handleRemoveMember}
        />
      </div>
    </ProtectedLayout>
  );
}
