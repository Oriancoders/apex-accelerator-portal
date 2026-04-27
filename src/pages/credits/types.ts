import type { Tables } from "@/integrations/supabase/types";

export type WithdrawalRequest = Tables<"credit_withdrawal_requests">;
export type CreditTransaction = Tables<"credit_transactions">;

export interface CreditCheckoutResponse {
  url?: string;
}

export interface PaymentVerificationResponse {
  success?: boolean;
  already_processed?: boolean;
  credits_added?: number;
}
