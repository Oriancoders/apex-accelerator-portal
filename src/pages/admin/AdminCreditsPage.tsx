import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
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
import { Search, TrendingUp, TrendingDown, Coins, Filter, Settings } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import CreditSettingsPanel from "@/components/admin/CreditSettingsPanel";

type Transaction = Tables<"credit_transactions">;

const typeLabels: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  purchase: { label: "Purchase", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: TrendingUp },
  deduction: { label: "Deduction", color: "bg-destructive/10 text-destructive", icon: TrendingDown },
  admin_credit: { label: "Admin Credit", color: "bg-primary/10 text-primary", icon: TrendingUp },
  admin_debit: { label: "Admin Debit", color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]", icon: TrendingDown },
  signup_bonus: { label: "Signup Bonus", color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]", icon: Coins },
};

export default function AdminCreditsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState("transactions");

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

  const totalPurchased = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const filtered = transactions.filter((t) => {
    const matchSearch = (t.description || "").toLowerCase().includes(search.toLowerCase()) || t.user_id.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchType;
  });

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
          <TabsList className="grid w-full grid-cols-2 rounded-xl max-w-xs">
            <TabsTrigger value="transactions" className="rounded-lg text-xs sm:text-sm gap-1.5">
              <Coins className="h-3.5 w-3.5" /> Transactions
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

          <TabsContent value="settings" className="mt-4">
            <CreditSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
