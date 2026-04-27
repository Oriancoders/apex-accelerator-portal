import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getInviteResultMessage, inviteCompanyMember } from "@/lib/invite-member";
import { adminDeleteEntity } from "@/lib/admin-delete";
import type { CompanySubscription } from "@/lib/subscriptions";
import type {
  AddMemberRole,
  CompanyRow,
  MembershipRow,
  ProfileRow,
} from "@/pages/admin/company-members/types";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function useAdminCompanyMembersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [companyId, setCompanyId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newRole, setNewRole] = useState<AddMemberRole>("member");
  const [memberToDelete, setMemberToDelete] = useState<MembershipRow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const ownerCount = useMemo(
    () => memberships.filter((membership) => membership.role === "owner").length,
    [memberships]
  );

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === companyId) || null,
    [companies, companyId]
  );

  const { data: selectedCompanyAgent = null } = useQuery({
    queryKey: ["admin-company-access-agent", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select("id, commission_percent, status, agents:agent_id(display_name, email, default_commission_percent)")
        .eq("company_id", companyId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as {
        id: string;
        commission_percent: number | null;
        status: string;
        agents?: { display_name: string | null; email: string | null; default_commission_percent: number } | null;
      } | null;
    },
    enabled: !!companyId,
  });

  const { data: selectedCompanySubscription = null } = useQuery({
    queryKey: ["admin-company-access-subscription", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await (supabase as any)
        .from("company_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("company_id", companyId)
        .eq("status", "active")
        .gt("ends_at", new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return (data || null) as CompanySubscription | null;
    },
    enabled: !!companyId,
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (formData: {
      name: string;
      slug: string;
      businessType: string;
      annualTurnover: string;
      website: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
    }) => {
      if (!user) throw new Error("Missing session");

      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: formData.name,
          slug: formData.slug,
          status: "active",
          created_by: user.id,
          created_via_agent_id: null,
          business_type: formData.businessType || null,
          annual_turnover: formData.annualTurnover ? parseFloat(formData.annualTurnover) : null,
          website: formData.website || null,
          address_line1: formData.addressLine1 || null,
          address_line2: formData.addressLine2 || null,
          city: formData.city || null,
          state: formData.state || null,
          postal_code: formData.postalCode || null,
          country: formData.country || null,
          contact_name: formData.contactName || null,
          contact_email: formData.contactEmail || null,
          contact_phone: formData.contactPhone || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return (data as any)?.id as string | undefined;
    },
    onSuccess: async (createdCompanyId) => {
      toast.success("Company created successfully");
      setIsCreateDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-members-companies"] });
      if (createdCompanyId) setCompanyId(createdCompanyId);
    },
    onError: (err: unknown) => {
      console.error("Create company failed:", err);
      toast.error("Unable to create company. Please try again.");
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Select a company first");
      if (!newMemberName.trim()) throw new Error("Enter a name");
      if (!newMemberEmail.trim()) throw new Error("Enter an email address");

      return inviteCompanyMember({
        companyId,
        fullName: newMemberName.trim(),
        email: newMemberEmail.trim(),
        membershipRole: newRole,
      });
    },
    onSuccess: (data) => {
      const message = getInviteResultMessage(data);
      toast.success(message);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewRole("member");
      queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", companyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-members-profiles"] });
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : "Operation failed";
      if (errorMsg.includes("Password reset email")) {
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg || "Operation failed. Please try again.");
      }
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

  const deleteCompanyMutation = useMutation({
    mutationFn: async (targetCompanyId: string) => {
      await adminDeleteEntity({ entityType: "company", entityId: targetCompanyId });
    },
    onSuccess: async (_, targetCompanyId) => {
      toast.success("Company deleted successfully");

      if (companyId === targetCompanyId) {
        setCompanyId("");
        setMemberToDelete(null);
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-members-companies"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", targetCompanyId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-company-access-agent", targetCompanyId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-company-access-subscription", targetCompanyId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Operation failed. Please try again.");
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
  };
}
