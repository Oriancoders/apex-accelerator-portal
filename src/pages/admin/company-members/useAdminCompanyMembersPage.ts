import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import type {
  AddMemberRole,
  CompanyRow,
  MembershipRow,
  ProfileRow,
} from "@/pages/admin/company-members/types";

export function useAdminCompanyMembersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [companyId, setCompanyId] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AddMemberRole>("member");
  const [memberToDelete, setMemberToDelete] = useState<MembershipRow | null>(null);

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["admin-members-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, status")
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as CompanyRow[];
    },
  });

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ["admin-company-memberships", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select("id, company_id, user_id, role, is_primary, invited_by, created_at, updated_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as MembershipRow[];
    },
    enabled: !!companyId,
  });

  const memberUserIds = useMemo(() => memberships.map((membership) => membership.user_id), [memberships]);

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-members-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
  });

  const profileByUserId = useMemo(() => {
    const map: Record<string, ProfileRow> = {};
    allProfiles.forEach((profile) => {
      map[profile.user_id] = profile;
    });
    return map;
  }, [allProfiles]);

  const addableProfiles = useMemo(() => {
    const memberSet = new Set(memberUserIds);
    return allProfiles.filter((profile) => !memberSet.has(profile.user_id));
  }, [allProfiles, memberUserIds]);

  const ownerCount = useMemo(
    () => memberships.filter((membership) => membership.role === "owner").length,
    [memberships]
  );

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === companyId) || null,
    [companies, companyId]
  );

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Select a company first");
      if (!newUserId) throw new Error("Select a user to add");

      const payload: TablesInsert<"company_memberships"> = {
        company_id: companyId,
        user_id: newUserId,
        role: newRole,
        invited_by: user?.id || null,
      };

      const { error } = await supabase.from("company_memberships").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added successfully");
      setNewUserId("");
      setNewRole("member");
      queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", companyId] });
    },
    onError: () => {
      toast.error("Operation failed. Please try again.");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      const { error } = await supabase
        .from("company_memberships")
        .update({ role })
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", companyId] });
    },
    onError: () => {
      toast.error("Operation failed. Please try again.");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("company_memberships")
        .delete()
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", companyId] });
      setMemberToDelete(null);
    },
    onError: () => {
      toast.error("Operation failed. Please try again.");
    },
  });

  const openDeleteDialog = (membership: MembershipRow) => {
    if (membership.role === "owner" && ownerCount <= 1) {
      toast.error("At least one owner must remain");
      return;
    }
    setMemberToDelete(membership);
  };

  const confirmDelete = () => {
    if (!memberToDelete) return;
    removeMemberMutation.mutate(memberToDelete.id);
  };

  return {
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
  };
}
