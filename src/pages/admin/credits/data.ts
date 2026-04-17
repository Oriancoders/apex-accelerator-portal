import { Coins, TrendingDown, TrendingUp } from "lucide-react";
import type { SummaryCard, TypeLabel } from "@/pages/admin/credits/types";

export const typeLabels: Record<string, TypeLabel> = {
  purchase: {
    label: "Purchase",
    color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    icon: TrendingUp,
  },
  deduction: {
    label: "Deduction",
    color: "bg-destructive/10 text-destructive",
    icon: TrendingDown,
  },
  admin_credit: {
    label: "Admin Credit",
    color: "bg-primary/10 text-primary",
    icon: TrendingUp,
  },
  admin_debit: {
    label: "Admin Debit",
    color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
    icon: TrendingDown,
  },
  signup_bonus: {
    label: "Signup Bonus",
    color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
    icon: Coins,
  },
};

export function buildSummaryCards(totalTransactions: number, totalPurchased: number, totalSpent: number): SummaryCard[] {
  return [
    {
      title: "Total Transactions",
      value: totalTransactions,
      icon: Coins,
      color: "text-primary",
      bg: "bg-primary/5",
    },
    {
      title: "Credits Added",
      value: totalPurchased,
      icon: TrendingUp,
      color: "text-[hsl(var(--success))]",
      bg: "bg-[hsl(var(--success))]/5",
    },
    {
      title: "Credits Spent",
      value: totalSpent,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/5",
    },
  ];
}
