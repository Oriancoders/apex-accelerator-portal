import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InsertMembership } from "../types";
import { uuidSchema } from "@/lib/validation";

export function useAddMemberMutation(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InsertMembership) => {
      const safePayload = {
        ...payload,
        company_id: uuidSchema.parse(payload.company_id),
        user_id: uuidSchema.parse(payload.user_id),
        role: ["admin", "member"].includes(String(payload.role)) ? payload.role : "member",
      };
      const { error } = await supabase.from("company_memberships").insert(safePayload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added successfully");
      queryClient.invalidateQueries({ queryKey: ["company-memberships-manage", companyId] });
      queryClient.invalidateQueries({ queryKey: ["agent-company-tickets"] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });
}

export function useUpdateRoleMutation(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      if (!["admin", "member"].includes(role)) throw new Error("Invalid role");
      const { error } = await supabase
        .from("company_memberships")
        .update({ role })
        .eq("id", uuidSchema.parse(membershipId));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member role updated");
      queryClient.invalidateQueries({ queryKey: ["company-memberships-manage", companyId] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });
}

export function useRemoveMemberMutation(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("company_memberships").delete().eq("id", uuidSchema.parse(membershipId));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["company-memberships-manage", companyId] });
      queryClient.invalidateQueries({ queryKey: ["agent-company-tickets"] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });
}
