import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getInviteResultMessage, inviteCompanyMember } from "@/lib/invite-member";
import { purchaseCompanySubscription, type SubscriptionPlan } from "@/lib/subscriptions";
import { boundedNumberSchema, uuidSchema } from "@/lib/validation";

export function useAddMemberMutation(
  companyId: string | undefined,
  userId: string | undefined,
  onSuccess: () => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fullName,
      email,
      role,
    }: {
      fullName: string;
      email: string;
      role: string;
    }) => {
      if (!companyId) throw new Error("No active company");
      if (!fullName.trim()) throw new Error("Please enter a name.");
      if (!email.trim()) throw new Error("Please enter an email address.");

      return inviteCompanyMember({
        companyId,
        fullName: fullName.trim(),
        email: email.trim(),
        membershipRole: role as "admin" | "member",
      });
    },
    onSuccess: (data) => {
      const message = getInviteResultMessage(data);
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["company-dash-members", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-dash-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["company-memberships", userId] });
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message || "Operation failed. Please try again."),
  });
}

export function useUpdateRoleMutation(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      const safeMembershipId = uuidSchema.parse(membershipId);
      if (!["admin", "member"].includes(role)) throw new Error("Invalid role");
      const { error } = await supabase.from("company_memberships").update({ role }).eq("id", safeMembershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-dash-members", companyId] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });
}

export function useRemoveMemberMutation(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const safeMembershipId = uuidSchema.parse(membershipId);
      const { error } = await supabase.from("company_memberships").delete().eq("id", safeMembershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["company-dash-members", companyId] });
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });
}

export function useUpdateAssignmentCommissionMutation(companyId: string | undefined, canManage: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, value }: { assignmentId: string; value: string }) => {
      if (!canManage) throw new Error("Not allowed");
      const parsed = boundedNumberSchema(0, 100).safeParse(value);
      if (!parsed.success) {
        throw new Error("Commission must be a number between 0 and 100");
      }

      const { error } = await supabase
        .from("agent_company_assignments")
        .update({ commission_percent: parsed.data })
        .eq("id", uuidSchema.parse(assignmentId));

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Commission updated");
      queryClient.invalidateQueries({ queryKey: ["company-dash-agent-assignments", companyId] });
    },
    onError: (err: Error) => toast.error("Operation failed. Please try again."),
  });
}

export function usePurchaseSubscriptionMutation(
  companyId: string | undefined,
  userCredits: number,
  onSuccess: () => Promise<void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      if (!companyId) throw new Error("No active company");
      if (userCredits < plan.price_credits) {
        throw new Error(`Insufficient credits. This plan requires ${plan.price_credits} credits.`);
      }

      return purchaseCompanySubscription(companyId, plan.id);
    },
    onSuccess: async () => {
      toast.success("Subscription activated. New tickets will go directly to approved.");
      await onSuccess();
      queryClient.invalidateQueries({ queryKey: ["company-active-subscription", companyId] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
    },
    onError: (error: Error) => toast.error(error.message || "Unable to activate subscription."),
  });
}
