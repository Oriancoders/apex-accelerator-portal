import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUserFacingError } from "@/lib/errors";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import { buildSummaryCards } from "@/pages/admin/credits/data";
import type {
  SummaryCard,
  Transaction,
  WithdrawalProfile,
  WithdrawalRequest,
} from "@/pages/admin/credits/types";

export function useAdminCreditsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState("transactions");
  const [withdrawSearch, setWithdrawSearch] = useState("");
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState("all");
  const [adminNoteById, setAdminNoteById] = useState<Record<string, string>>({});
  const [payoutRefById, setPayoutRefById] = useState<Record<string, string>>({});
  const [minWithdrawInput, setMinWithdrawInput] = useState("");

  const { settings, updateSetting } = useCreditSettings();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("credit_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as Transaction[];
    },
  });

  const { data: withdrawalRequests = [], isLoading: withdrawalLoading } = useQuery({
    queryKey: ["admin-withdrawal-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WithdrawalRequest[];
    },
  });

  const withdrawalUserIds = useMemo(
    () => Array.from(new Set(withdrawalRequests.map((request) => request.user_id))),
    [withdrawalRequests]
  );

  const { data: withdrawalProfiles = [] } = useQuery({
    queryKey: ["admin-withdrawal-profiles", withdrawalUserIds],
    queryFn: async () => {
      if (!withdrawalUserIds.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", withdrawalUserIds);
      if (error) throw error;
      return (data || []) as WithdrawalProfile[];
    },
    enabled: withdrawalUserIds.length > 0,
  });

  const profileByUserId = useMemo(() => {
    const map: Record<string, WithdrawalProfile> = {};
    withdrawalProfiles.forEach((profile) => {
      map[profile.user_id] = profile;
    });
    return map;
  }, [withdrawalProfiles]);

  const updateWithdrawalStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
    }: {
      id: string;
      status: string;
      adminNotes?: string;
    }) => {
      const payload: {
        status: string;
        admin_notes?: string;
        processed_at?: string;
      } = { status };

      if (adminNotes && adminNotes.trim()) {
        payload.admin_notes = adminNotes.trim();
      }
      if (status === "rejected" || status === "cancelled") {
        payload.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("credit_withdrawal_requests")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal request updated");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-requests"] });
    },
    onError: (error: Error) => {
      toast.error(getUserFacingError(error, "Unable to update withdrawal request."));
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({
      id,
      adminNotes,
      payoutReference,
    }: {
      id: string;
      adminNotes?: string;
      payoutReference?: string;
    }) => {
      const { error } = await supabase.rpc("admin_mark_withdrawal_paid", {
        p_request_id: id,
        p_admin_notes: adminNotes?.trim() || null,
        p_payout_reference: payoutReference?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout marked as paid and credits deducted");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    },
    onError: (error: Error) => {
      toast.error(getUserFacingError(error, "Unable to mark payout as paid."));
    },
  });

  const totalPurchased = useMemo(
    () => transactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  const totalSpent = useMemo(
    () => transactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    [transactions]
  );

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchSearch =
          (transaction.description || "").toLowerCase().includes(search.toLowerCase()) ||
          transaction.user_id.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || transaction.type === typeFilter;
        return matchSearch && matchType;
      }),
    [transactions, search, typeFilter]
  );

  const filteredWithdrawals = useMemo(
    () =>
      withdrawalRequests.filter((request) => {
        const profile = profileByUserId[request.user_id];
        const query = withdrawSearch.toLowerCase();
        const searchMatch =
          (profile?.full_name || "").toLowerCase().includes(query) ||
          (profile?.email || "").toLowerCase().includes(query) ||
          request.user_id.toLowerCase().includes(query);

        const statusMatch = withdrawStatusFilter === "all" || request.status === withdrawStatusFilter;
        return searchMatch && statusMatch;
      }),
    [withdrawalRequests, profileByUserId, withdrawSearch, withdrawStatusFilter]
  );

  const pendingCount = useMemo(
    () => withdrawalRequests.filter((request) => request.status === "pending" || request.status === "approved").length,
    [withdrawalRequests]
  );

  const totalRequested = useMemo(
    () => withdrawalRequests.reduce((sum, request) => sum + Number(request.requested_credits || 0), 0),
    [withdrawalRequests]
  );

  const saveMinWithdrawalMutation = useMutation({
    mutationFn: async () => {
      const parsed = Number(minWithdrawInput);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("Minimum withdrawal must be a positive number");
      }
      await updateSetting.mutateAsync({ key: "min_withdrawal_credits", value: parsed });
    },
    onSuccess: () => {
      toast.success("Minimum withdrawal credits updated");
      queryClient.invalidateQueries({ queryKey: ["credit-settings"] });
    },
    onError: (error: Error) => {
      toast.error(getUserFacingError(error, "Unable to update minimum withdrawal setting."));
    },
  });

  const effectiveMinWithdraw = Number(settings.minWithdrawalCredits || 0);

  const summaryCards: SummaryCard[] = useMemo(
    () => buildSummaryCards(transactions.length, totalPurchased, totalSpent),
    [transactions.length, totalPurchased, totalSpent]
  );

  return {
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    tab,
    setTab,
    withdrawSearch,
    setWithdrawSearch,
    withdrawStatusFilter,
    setWithdrawStatusFilter,
    adminNoteById,
    setAdminNoteById,
    payoutRefById,
    setPayoutRefById,
    minWithdrawInput,
    setMinWithdrawInput,
    transactions,
    isLoading,
    withdrawalRequests,
    withdrawalLoading,
    profileByUserId,
    updateWithdrawalStatusMutation,
    markPaidMutation,
    filtered,
    filteredWithdrawals,
    pendingCount,
    totalRequested,
    saveMinWithdrawalMutation,
    effectiveMinWithdraw,
    summaryCards,
  };
}
