import AdminLayout from "@/components/AdminLayout";
import CreditSettingsPanel from "@/components/admin/CreditSettingsPanel";
import SubscriptionPlansPanel from "@/components/admin/SubscriptionPlansPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, CreditCard, Settings, Wallet } from "lucide-react";
import TransactionsSummaryCards from "@/pages/admin/credits/TransactionsSummaryCards";
import TransactionsTableCard from "@/pages/admin/credits/TransactionsTableCard";
import WithdrawalsMinCard from "@/pages/admin/credits/WithdrawalsMinCard";
import WithdrawalsStatsCards from "@/pages/admin/credits/WithdrawalsStatsCards";
import WithdrawalsTableCard from "@/pages/admin/credits/WithdrawalsTableCard";
import { useAdminCreditsPage } from "@/pages/admin/credits/useAdminCreditsPage";

export default function AdminCreditsPage() {
  const {
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
  } = useAdminCreditsPage();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Credit Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Transactions & pricing settings</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4 rounded-ds-md max-w-2xl">
            <TabsTrigger value="transactions" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <Coins className="h-3.5 w-3.5" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Withdrawals
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Pricing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4 space-y-4">
            <TransactionsSummaryCards cards={summaryCards} />
            <TransactionsTableCard
              search={search}
              typeFilter={typeFilter}
              isLoading={isLoading}
              transactions={filtered}
              onSearchChange={setSearch}
              onTypeFilterChange={setTypeFilter}
            />
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4 space-y-4">
            <WithdrawalsMinCard
              effectiveMinWithdraw={effectiveMinWithdraw}
              minWithdrawInput={minWithdrawInput}
              isPending={saveMinWithdrawalMutation.isPending}
              onInputChange={setMinWithdrawInput}
              onSave={() => saveMinWithdrawalMutation.mutate()}
            />

            <WithdrawalsStatsCards
              totalRequests={withdrawalRequests.length}
              pendingCount={pendingCount}
              totalRequested={totalRequested}
            />

            <WithdrawalsTableCard
              search={withdrawSearch}
              statusFilter={withdrawStatusFilter}
              isLoading={withdrawalLoading}
              requests={filteredWithdrawals}
              profileByUserId={profileByUserId}
              adminNoteById={adminNoteById}
              payoutRefById={payoutRefById}
              onSearchChange={setWithdrawSearch}
              onStatusFilterChange={setWithdrawStatusFilter}
              onAdminNoteChange={(id, value) =>
                setAdminNoteById((prev) => ({ ...prev, [id]: value }))
              }
              onPayoutRefChange={(id, value) =>
                setPayoutRefById((prev) => ({ ...prev, [id]: value }))
              }
              onApprove={(id, adminNotes) =>
                updateWithdrawalStatusMutation.mutate({ id, status: "approved", adminNotes })
              }
              onReject={(id, adminNotes) =>
                updateWithdrawalStatusMutation.mutate({ id, status: "rejected", adminNotes })
              }
              onMarkPaid={(id, adminNotes, payoutReference) =>
                markPaidMutation.mutate({ id, adminNotes, payoutReference })
              }
            />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <SubscriptionPlansPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <CreditSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
