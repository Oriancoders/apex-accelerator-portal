import { PlanDraft } from "./types";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function validatePlanDraft(draft: PlanDraft): { valid: boolean; error?: string } {
  const name = draft.name.trim();
  if (!name) {
    return { valid: false, error: "Plan name is required" };
  }

  const price = Number(draft.priceCredits);
  if (!Number.isFinite(price) || price < 0) {
    return { valid: false, error: "Price credits must be 0 or greater" };
  }

  const duration = Number(draft.durationDays);
  if (!Number.isFinite(duration) || duration <= 0) {
    return { valid: false, error: "Duration must be greater than 0" };
  }

  const commission = Number(draft.partnerCommissionPercent);
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    return { valid: false, error: "Commission must be 0-100" };
  }

  return { valid: true };
}

export function preparePlanPayload(draft: PlanDraft) {
  const name = draft.name.trim();
  return {
    name,
    slug: draft.slug.trim() || slugify(name),
    description: draft.description.trim() || null,
    price_credits: Math.round(Number(draft.priceCredits)),
    duration_days: Math.round(Number(draft.durationDays)),
    partner_commission_percent: Number(draft.partnerCommissionPercent),
    is_active: true,
  };
}

export function formatSubscriptionEndDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
