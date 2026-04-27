import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PlanDraft } from "../types";
import { validatePlanDraft, preparePlanPayload } from "../utils";

export function usePlanMutations() {
  const queryClient = useQueryClient();

  const savePlan = useMutation({
    mutationFn: async ({
      draft,
      editingId,
    }: {
      draft: PlanDraft;
      editingId: string | null;
    }) => {
      const validation = validatePlanDraft(draft);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const payload = preparePlanPayload(draft);

      if (editingId) {
        const { error } = await (supabase as any)
          .from("subscription_plans")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("subscription_plans")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.editingId
          ? "Subscription plan updated"
          : "Subscription plan created"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to save subscription plan"),
  });

  const togglePlan = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await (supabase as any)
        .from("subscription_plans")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to update plan"),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("subscription_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscription plan deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
    },
    onError: () =>
      toast.error(
        "Plan is already used by subscriptions. Disable it instead."
      ),
  });

  const cancelSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("company_subscriptions")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company subscription cancelled");
      queryClient.invalidateQueries({
        queryKey: ["admin-company-subscriptions"],
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Unable to cancel subscription"),
  });

  return {
    savePlan,
    togglePlan,
    deletePlan,
    cancelSubscription,
  };
}
