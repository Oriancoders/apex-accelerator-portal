import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ASSIGNABLE_ROLES,
  ROLE_PRIORITY,
  type AppRole,
  type Profile,
  type UserCompanyMembershipRow,
} from "@/pages/admin/users/types";

export function useAdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [creditAdjust, setCreditAdjust] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return (data || []) as Profile[];
    },
  });

  const userIds = useMemo(() => users.map((user) => user.user_id), [users]);

  const { data: userCompanyMemberships = [] } = useQuery({
    queryKey: ["admin-user-company-memberships", userIds],
    queryFn: async () => {
      if (!userIds.length) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select("user_id, is_primary, companies:company_id(name)")
        .in("user_id", userIds)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return (data || []) as UserCompanyMembershipRow[];
    },
    enabled: userIds.length > 0,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as { user_id: string; role: string; created_at: string }[];
    },
  });

  const roleByUserId = useMemo(() => {
    const map = new Map<string, AppRole>();

    userRoles.forEach((row) => {
      if (!ASSIGNABLE_ROLES.includes(row.role as AppRole)) return;
      const nextRole = row.role as AppRole;
      const currentRole = map.get(row.user_id);

      if (!currentRole || ROLE_PRIORITY[nextRole] < ROLE_PRIORITY[currentRole]) {
        map.set(row.user_id, nextRole);
      }
    });

    return map;
  }, [userRoles]);

  const companyNameByUserId = useMemo(() => {
    const map = new Map<string, string>();

    userCompanyMemberships.forEach((row) => {
      const companyName = row.companies?.name;
      if (!companyName) return;
      if (!map.has(row.user_id)) {
        map.set(row.user_id, companyName);
      }
    });

    return map;
  }, [userCompanyMemberships]);

  useEffect(() => {
    if (!selectedUser) {
      setSelectedRole("");
      return;
    }

    setSelectedRole(roleByUserId.get(selectedUser.user_id) || "member");
  }, [selectedUser, roleByUserId]);

  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const { data, error } = await supabase.rpc("admin_adjust_credits", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason || "Admin adjustment",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Credits adjusted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUser(null);
      setCreditAdjust("");
      setCreditReason("");
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await (supabase as any).rpc("admin_set_user_role", {
        p_target_user_id: userId,
        p_role: role,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const handleAdjustCredits = (positive: boolean) => {
    if (!selectedUser || !creditAdjust) return;
    const amount = Math.abs(parseFloat(creditAdjust)) * (positive ? 1 : -1);
    adjustCreditsMutation.mutate({ userId: selectedUser.user_id, amount, reason: creditReason });
  };

  const getCompanyLabel = (user: Profile) => companyNameByUserId.get(user.user_id) || user.company || "—";

  const filtered = users.filter((user) => {
    const query = search.toLowerCase();
    return (
      (user.full_name || "").toLowerCase().includes(query) ||
      (user.email || "").toLowerCase().includes(query) ||
      getCompanyLabel(user).toLowerCase().includes(query)
    );
  });

  return {
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
    adjustCreditsMutation,
    filtered,
    getCompanyLabel,
    handleAdjustCredits,
  };
}
