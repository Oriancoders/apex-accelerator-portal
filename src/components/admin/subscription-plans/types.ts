import type { SubscriptionPlan } from "@/lib/subscriptions";

export type PlanDraft = {
  name: string;
  slug: string;
  description: string;
  priceCredits: string;
  durationDays: string;
  partnerCommissionPercent: string;
};

export type ActiveSubscription = {
  id: string;
  plan_id: string;
  company_id: string;
  status: "active" | "cancelled";
  ends_at: string;
  partner_commission_credits: number;
  created_at: string;
  companies?: {
    name: string;
    slug: string;
  };
  subscription_plans?: {
    name: string;
  };
};

export type { SubscriptionPlan };
