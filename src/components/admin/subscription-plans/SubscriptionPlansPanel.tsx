import { useState } from "react";
import { PlanFormCard } from "./PlanFormCard";
import { PlansListCard } from "./PlansListCard";
import { CompanySubscriptionsCard } from "./CompanySubscriptionsCard";
import { usePlansQuery, useSubscriptionsQuery, usePlanMutations } from "./hooks";
import { INITIAL_DRAFT } from "./constants";
import type { PlanDraft, SubscriptionPlan } from "./types";

export default function SubscriptionPlansPanel() {
  const [draft, setDraft] = useState<PlanDraft>(INITIAL_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = usePlansQuery();
  const { data: subscriptions = [] } = useSubscriptionsQuery();
  const { savePlan, togglePlan, deletePlan, cancelSubscription } = usePlanMutations();

  const handleSavePlan = () => {
    savePlan.mutate(
      { draft, editingId },
      {
        onSuccess: () => {
          setDraft(INITIAL_DRAFT);
          setEditingId(null);
        },
      }
    );
  };

  const handleStartEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setDraft({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      priceCredits: String(plan.price_credits),
      durationDays: String(plan.duration_days),
      partnerCommissionPercent: String(plan.partner_commission_percent),
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraft(INITIAL_DRAFT);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <PlanFormCard
        draft={draft}
        editingId={editingId}
        onDraftChange={setDraft}
        onSave={handleSavePlan}
        onCancel={handleCancel}
        isSaving={savePlan.isPending}
      />

      <PlansListCard
        plans={plans}
        isLoading={isLoading}
        onEdit={handleStartEdit}
        onToggle={(id, isActive) => togglePlan.mutate({ id, isActive })}
        onDelete={(id) => deletePlan.mutate(id)}
        isDeleting={deletePlan.isPending}
        isToggling={togglePlan.isPending}
      />

      <CompanySubscriptionsCard
        subscriptions={subscriptions}
        plans={plans}
        onCancel={(id) => cancelSubscription.mutate(id)}
        isCancelling={cancelSubscription.isPending}
      />
    </div>
  );
}
