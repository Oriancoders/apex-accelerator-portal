import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFacingError } from "@/lib/errors";
import type { CreditCheckoutResponse } from "../types";

export function useSubmitWithdrawalMutation(userId: string | undefined, minWithdrawal: number, availableCredits: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      credits,
      method,
      accountDetails,
      note,
    }: {
      credits: string;
      method: string;
      accountDetails: string;
      note: string;
    }) => {
      if (!userId) throw new Error("You must be logged in");

      const requested = Number(credits);
      if (!Number.isFinite(requested) || requested <= 0) {
        throw new Error("Enter a valid credit amount");
      }

      if (requested < minWithdrawal) {
        throw new Error(`Minimum withdrawal is ${minWithdrawal} credits`);
      }

      if (requested > availableCredits) {
        throw new Error("Requested credits exceed your balance");
      }

      if (!accountDetails.trim()) {
        throw new Error("Account details are required");
      }

      const { error } = await supabase.from("credit_withdrawal_requests").insert({
        user_id: userId,
        requested_credits: requested,
        payment_method: method,
        account_details: accountDetails.trim(),
        requester_note: note.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal request sent to admin");
      queryClient.invalidateQueries({ queryKey: ["my-withdrawal-requests", userId] });
    },
    onError: (err: Error) => toast.error(getUserFacingError(err, "Unable to submit withdrawal request right now.")),
  });
}

export function usePurchaseCreditsMutation() {
  return useMutation({
    mutationFn: async (packageIndex: number): Promise<CreditCheckoutResponse> => {
      const { data, error } = await supabase.functions.invoke("create-credit-checkout", {
        body: { packageIndex },
      });
      if (error) throw error;
      return data;
    },
    onError: (err: any) => toast.error(getUserFacingError(err, "Failed to create checkout session.")),
  });
}
