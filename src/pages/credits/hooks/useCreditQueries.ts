import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WithdrawalRequest, CreditTransaction } from "../types";
import { PAGE_SIZE } from "../constants";

export function useCreditTransactions(userId: string | undefined, page: number) {
  return useQuery({
    queryKey: ["credit-transactions", userId, page],
    queryFn: async () => {
      if (!userId) return { rows: [], total: 0 };
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("credit_transactions")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: (data || []) as CreditTransaction[], total: count || 0 };
    },
    enabled: !!userId,
  });
}

export function useWithdrawalRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-withdrawal-requests", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("credit_withdrawal_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WithdrawalRequest[];
    },
    enabled: !!userId,
  });
}
