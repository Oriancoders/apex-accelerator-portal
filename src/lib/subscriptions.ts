import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_credits: number;
  duration_days: number;
  partner_commission_percent: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompanySubscription = {
  id: string;
  company_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired";
  starts_at: string;
  ends_at: string;
  purchased_by: string | null;
  purchased_credit_transaction_id: string | null;
  partner_agent_id: string | null;
  partner_commission_percent: number;
  partner_commission_credits: number;
  partner_commission_transaction_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan | null;
};

export async function fetchActiveSubscription(companyId: string) {
  const { data, error } = await (supabase as any)
    .from("company_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("company_id", companyId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  return (data || null) as CompanySubscription | null;
}

export function getSubscriptionDaysLeft(subscription: Pick<CompanySubscription, "ends_at"> | null | undefined) {
  if (!subscription?.ends_at) return 0;

  const endsAt = new Date(subscription.ends_at).getTime();
  const now = Date.now();
  if (Number.isNaN(endsAt) || endsAt <= now) return 0;

  return Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24));
}

export async function fetchActiveSubscriptionPlans() {
  const { data, error } = await (supabase as any)
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("price_credits", { ascending: true });

  if (error) throw error;
  return (data || []) as SubscriptionPlan[];
}

export async function purchaseCompanySubscription(companyId: string, planId: string) {
  const { data, error } = await (supabase as any).rpc("purchase_company_subscription", {
    p_company_id: companyId,
    p_plan_id: planId,
  });

  if (error) throw error;
  return data as CompanySubscription;
}
