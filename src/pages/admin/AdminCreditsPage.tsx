import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Search, TrendingUp, TrendingDown, Coins, Filter, Settings, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import CreditSettingsPanel from "@/components/admin/CreditSettingsPanel";
import { toast } from "sonner";
import { useCreditSettings } from "@/hooks/useCreditSettings";

type Transaction = Tables<"credit_transactions">;
type WithdrawalRequest = Tables<"credit_withdrawal_requests">;

const typeLabels: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  purchase: { label: "Purchase", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: TrendingUp },
  deduction: { label: "Deduction", color: "bg-destructive/10 text-destructive", icon: TrendingDown },
  admin_credit: { label: "Admin Credit", color: "bg-primary/10 text-primary", icon: TrendingUp },
  admin_debit: { label: "Admin Debit", color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]", icon: TrendingDown },
  signup_bonus: { label: "Signup Bonus", color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]", icon: Coins },
};

export default function AdminCreditsPage() {
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

  const withdrawalUserIds = Array.from(new Set(withdrawalRequests.map((r) => r.user_id)));

  const { data: withdrawalProfiles = [] } = useQuery({
    queryKey: ["admin-withdrawal-profiles", withdrawalUserIds],
    queryFn: async () => {
      if (!withdrawalUserIds.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", withdrawalUserIds);
      if (error) throw error;
      return data || [];
    },
    enabled: withdrawalUserIds.length > 0,
  });

  const profileByUserId = new Map(withdrawalProfiles.map((p) => [p.user_id, p]));

  const updateWithdrawalStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const payload: any = { status };
      if (adminNotes && adminNotes.trim()) payload.admin_notes = adminNotes.trim();
      if (status === "rejected" || status === "cancelled") payload.processed_at = new Date().toISOString();

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
    onError: (err: Error) => toast.error(err.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, adminNotes, payoutReference }: { id: string; adminNotes?: string; payoutReference?: string }) => {
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
    onError: (err: Error) => toast.error(err.message),
  });

  const totalPurchased = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const filtered = transactions.filter((t) => {
    const matchSearch = (t.description || "").toLowerCase().includes(search.toLowerCase()) || t.user_id.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const filteredWithdrawals = withdrawalRequests.filter((r) => {
    const profile = profileByUserId.get(r.user_id);
    const q = withdrawSearch.toLowerCase();
    const searchMatch =
      (profile?.full_name || "").toLowerCase().includes(q) ||
      (profile?.email || "").toLowerCase().includes(q) ||
      r.user_id.toLowerCase().includes(q);
    const statusMatch = withdrawStatusFilter === "all" || r.status === withdrawStatusFilter;
    return searchMatch && statusMatch;
  });

  const pendingCount = withdrawalRequests.filter((r) => r.status === "pending" || r.status === "approved").length;
  const totalRequested = withdrawalRequests.reduce((sum, r) => sum + Number(r.requested_credits || 0), 0);

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
    onError: (err: Error) => toast.error(err.message),
  });

  const effectiveMinWithdraw = Number(settings.minWithdrawalCredits || 0);

  const summaryCards = [
    { title: "Total Transactions", value: transactions.length, icon: Coins, color: "text-primary", bg: "bg-primary/5" },
    { title: "Credits Added", value: totalPurchased, icon: TrendingUp, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5" },
    { title: "Credits Spent", value: totalSpent, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/5" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Credit Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Transactions & pricing settings</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3 rounded-xl max-w-md">
            <TabsTrigger value="transactions" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <Coins className="h-3.5 w-3.5" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Withdrawals
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Pricing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {summaryCards.map((card, i) => (
                <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                  <Card className="rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                      <div className={`p-1.5 sm:p-2 rounded-lg ${card.bg}`}>
                        <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                      <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${card.color}`}>{card.value}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="rounded-2xl">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by description or user ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl" />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="deduction">Deduction</SelectItem>
                      <SelectItem value="admin_credit">Admin Credit</SelectItem>
                      <SelectItem value="admin_debit">Admin Debit</SelectItem>
                      <SelectItem value="signup_bonus">Signup Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>User ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((tx) => {
                            const typeInfo = typeLabels[tx.type] || { label: tx.type, color: "bg-muted text-muted-foreground", icon: Coins };
                            return (
                              <TableRow key={tx.id}>
                                <TableCell className="text-sm text-muted-foreground">{format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                                <TableCell><Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge></TableCell>
                                <TableCell className={`font-semibold ${tx.amount > 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                                </TableCell>
                                <TableCell className="text-sm max-w-[250px] truncate">{tx.description || "—"}</TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono">{tx.user_id.slice(0, 8)}...</TableCell>
                              </TableRow>
                            );
                          })}
                          {filtered.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                <Coins className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                No transactions found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="sm:hidden space-y-2 px-4">
                      {filtered.map((tx) => {
                        const typeInfo = typeLabels[tx.type] || { label: tx.type, color: "bg-muted text-muted-foreground", icon: Coins };
                        return (
                          <div key={tx.id} className="p-4 rounded-xl border border-border">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`${typeInfo.color} text-[10px]`}>{typeInfo.label}</Badge>
                              <span className={`text-sm font-bold ${tx.amount > 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                                {tx.amount > 0 ? "+" : ""}{tx.amount}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mt-2 line-clamp-2">{tx.description || "—"}</p>
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}</p>
                          </div>
                        );
                      })}
                      {filtered.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Coins className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          No transactions found
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4 space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Minimum Withdrawal Credits</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Current minimum: {effectiveMinWithdraw} credits</p>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={minWithdrawInput}
                    onChange={(e) => setMinWithdrawInput(e.target.value)}
                    placeholder={String(effectiveMinWithdraw || 10)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button
                  className="h-11 rounded-xl"
                  onClick={() => saveMinWithdrawalMutation.mutate()}
                  disabled={saveMinWithdrawalMutation.isPending || !minWithdrawInput.trim()}
                >
                  Save Minimum
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="rounded-2xl">
                <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                  <div className="text-2xl font-bold text-primary">{withdrawalRequests.length}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending / Approved</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                  <div className="text-2xl font-bold text-warning">{pendingCount}</div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Credits Requested</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                  <div className="text-2xl font-bold text-foreground">{totalRequested}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl">
              <CardHeader className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user name, email or user ID..."
                      value={withdrawSearch}
                      onChange={(e) => setWithdrawSearch(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                  <Select value={withdrawStatusFilter} onValueChange={setWithdrawStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                {withdrawalLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading withdrawal requests...</div>
                ) : (
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Account Details</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWithdrawals.map((req) => {
                          const p = profileByUserId.get(req.user_id);
                          const canApprove = req.status === "pending";
                          const canPay = req.status === "pending" || req.status === "approved";
                          const canReject = req.status === "pending" || req.status === "approved";

                          return (
                            <TableRow key={req.id}>
                              <TableCell className="text-sm text-muted-foreground">{format(new Date(req.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{p?.full_name || "Unknown user"}</p>
                                  <p className="text-xs text-muted-foreground">{p?.email || req.user_id}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">{req.requested_credits}</TableCell>
                              <TableCell className="capitalize">{req.payment_method.replace("_", " ")}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{req.status}</Badge>
                              </TableCell>
                              <TableCell className="max-w-[280px]">
                                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{req.account_details}</p>
                                {req.requester_note && (
                                  <p className="text-xs text-muted-foreground mt-1">Note: {req.requester_note}</p>
                                )}
                                {req.admin_notes && (
                                  <p className="text-xs text-muted-foreground mt-1">Admin: {req.admin_notes}</p>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-2">
                                  {(canApprove || canPay || canReject) && (
                                    <>
                                      <Input
                                        placeholder="Admin note"
                                        className="h-8 rounded-lg w-52"
                                        value={adminNoteById[req.id] || ""}
                                        onChange={(e) => setAdminNoteById((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                      />
                                      <Input
                                        placeholder="Payout reference"
                                        className="h-8 rounded-lg w-52"
                                        value={payoutRefById[req.id] || ""}
                                        onChange={(e) => setPayoutRefById((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                      />
                                    </>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {canApprove && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg"
                                        onClick={() =>
                                          updateWithdrawalStatusMutation.mutate({
                                            id: req.id,
                                            status: "approved",
                                            adminNotes: adminNoteById[req.id],
                                          })
                                        }
                                      >
                                        Approve
                                      </Button>
                                    )}
                                    {canReject && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-lg text-destructive"
                                        onClick={() =>
                                          updateWithdrawalStatusMutation.mutate({
                                            id: req.id,
                                            status: "rejected",
                                            adminNotes: adminNoteById[req.id],
                                          })
                                        }
                                      >
                                        Reject
                                      </Button>
                                    )}
                                    {canPay && (
                                      <Button
                                        size="sm"
                                        className="rounded-lg"
                                        onClick={() =>
                                          markPaidMutation.mutate({
                                            id: req.id,
                                            adminNotes: adminNoteById[req.id],
                                            payoutReference: payoutRefById[req.id],
                                          })
                                        }
                                      >
                                        Mark Paid
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredWithdrawals.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                              No withdrawal requests found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <CreditSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
