import type { LucideIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export type Transaction = Tables<"credit_transactions">;
export type WithdrawalRequest = Tables<"credit_withdrawal_requests">;

export type WithdrawalProfile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

export type TypeLabel = {
  label: string;
  color: string;
  icon: LucideIcon;
};

export type SummaryCard = {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
};
