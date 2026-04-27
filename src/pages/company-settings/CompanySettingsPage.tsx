import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useActiveSubscription, useSubscriptionPlans, useCompanyMembers, useAllProfiles, useCompanyTickets, useAgentAssignments } from "./hooks/useCompanySettingsQueries";
import { useAddMemberMutation, useUpdateRoleMutation, useRemoveMemberMutation, useUpdateAssignmentCommissionMutation, usePurchaseSubscriptionMutation } from "./hooks/useCompanySettingsMutations";
import { buildProfileByUserIdMap, getMemberUserIds, getOwnerCount, calculateTicketStats } from "./utils";
import { Header } from "./components/Header";
import { StatsCards } from "./components/StatsCards";
import { AddMemberForm } from "./components/AddMemberForm";
import { MembersList } from "./components/MembersList";
import { RecentTicketsTable } from "./components/RecentTicketsTable";
import { SubscriptionCard } from "./components/SubscriptionCard";
import { AgentAssignmentsCard } from "./components/AgentAssignmentsCard";
import { RemoveConfirmDialog } from "./components/RemoveConfirmDialog";
import type { MembershipRow } from "./types";

export default function CompanySettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isGuest } = useAuth();
  const {
    isLoading: tenantLoading,
    activeCompany: defaultActive,
    activeMembership: defaultMembership,
    memberships,
  } = useAgentTenant();

  const activeMembership = useMemo(() => {
    if (slug) {
      return memberships.find(m => m.companies?.slug === slug) || null;
    }
    return defaultMembership;
  }, [slug, memberships, defaultMembership]);

  const activeCompany = activeMembership?.companies || null;

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");
  const [memberToDelete, setMemberToDelete] = useState<MembershipRow | null>(null);
  const [commissionDraftByAssignment, setCommissionDraftByAssignment] = useState<Record<string, string>>({});
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const canManage = !isGuest && !!activeCompany;

  const { data: activeSubscription } = useActiveSubscription(activeCompany?.id);
  const { data: subscriptionPlans = [] } = useSubscriptionPlans(canManage);
  const { data: companyMembers = [], isLoading: membersLoading } = useCompanyMembers(activeCompany?.id);
  const { data: allProfiles = [] } = useAllProfiles(canManage);

  const memberUserIds = useMemo(() => getMemberUserIds(companyMembers), [companyMembers]);
  const { data: companyTickets = [] } = useCompanyTickets(memberUserIds);
  const { data: agentAssignments = [] } = useAgentAssignments(activeCompany?.id);

  const profileByUserId = useMemo(() => buildProfileByUserIdMap(allProfiles), [allProfiles]);
  const ownerCount = useMemo(() => getOwnerCount(companyMembers), [companyMembers]);
  const ticketStats = useMemo(() => calculateTicketStats(companyTickets), [companyTickets]);

  const addMemberMutation = useAddMemberMutation(activeCompany?.id, user?.id, () => {
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("member");
  });
  const updateRoleMutation = useUpdateRoleMutation(activeCompany?.id);
  const removeMemberMutation = useRemoveMemberMutation(activeCompany?.id);
  const updateAssignmentCommissionMutation = useUpdateAssignmentCommissionMutation(activeCompany?.id, canManage);
  const purchaseSubscriptionMutation = usePurchaseSubscriptionMutation(
    activeCompany?.id,
    profile?.credits ?? 0,
    async () => {
      setSelectedPlanId("");
      await refreshProfile();
    }
  );

  const handleAddMember = () => {
    addMemberMutation.mutate({
      fullName: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
    });
  };

  const handleRemoveMember = () => {
    if (!memberToDelete) return;
    removeMemberMutation.mutate(memberToDelete.id);
    setMemberToDelete(null);
  };

  if (tenantLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading company workspace…</div>
      </ProtectedLayout>
    );
  }

  if (!activeCompany) {
    return (
      <ProtectedLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">No active company</h2>
          <p className="text-sm text-muted-foreground">Create or switch to a company first.</p>
          <Button onClick={() => navigate("/agent/dashboard")}>Go to Agent Dashboard</Button>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <Header
          companyName={activeCompany.name}
          companySlug={activeCompany.slug}
          companyStatus={activeCompany.status}
          membershipsCount={memberships.length}
        />

        <StatsCards
          memberCount={companyMembers.length}
          totalTickets={ticketStats.total}
          openTickets={ticketStats.open}
          hasSubscription={!!activeSubscription}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {canManage && (
              <AddMemberForm
                name={newMemberName}
                setName={setNewMemberName}
                email={newMemberEmail}
                setEmail={setNewMemberEmail}
                role={newMemberRole}
                setRole={setNewMemberRole}
                isPending={addMemberMutation.isPending}
                onSubmit={handleAddMember}
              />
            )}

            <MembersList
              memberships={companyMembers}
              profileByUserId={profileByUserId}
              isLoading={membersLoading}
              canManage={canManage}
              ownerCount={ownerCount}
              updateRoleMutation={updateRoleMutation}
              onDeleteClick={setMemberToDelete}
            />

            <RecentTicketsTable tickets={companyTickets} />
          </div>

          <div className="space-y-4">
            <SubscriptionCard
              activeSubscription={activeSubscription}
              subscriptionPlans={subscriptionPlans}
              selectedPlanId={selectedPlanId}
              setSelectedPlanId={setSelectedPlanId}
              userCredits={profile?.credits ?? 0}
              isPending={purchaseSubscriptionMutation.isPending}
              onPurchase={(plan) => purchaseSubscriptionMutation.mutate(plan)}
            />

            <AgentAssignmentsCard
              assignments={agentAssignments}
              canManage={canManage}
              commissionDraftByAssignment={commissionDraftByAssignment}
              setCommissionDraftByAssignment={setCommissionDraftByAssignment}
              updateMutation={updateAssignmentCommissionMutation}
            />
          </div>
        </div>
      </div>

      <RemoveConfirmDialog
        memberToDelete={memberToDelete}
        onOpenChange={setMemberToDelete}
        companyName={activeCompany.name}
        onConfirm={handleRemoveMember}
      />
    </ProtectedLayout>
  );
}
