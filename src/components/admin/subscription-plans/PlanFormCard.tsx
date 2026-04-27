import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import type { PlanDraft } from "./types";
import { slugify } from "./utils";

interface PlanFormCardProps {
  draft: PlanDraft;
  editingId: string | null;
  onDraftChange: (draft: PlanDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function PlanFormCard({
  draft,
  editingId,
  onDraftChange,
  onSave,
  onCancel,
  isSaving,
}: PlanFormCardProps) {
  const updateField = <K extends keyof PlanDraft>(
    key: K,
    value: PlanDraft[K]
  ) => {
    onDraftChange({ ...draft, [key]: value });
  };

  const handleNameChange = (value: string) => {
    updateField("name", value);
    if (!editingId) {
      updateField("slug", slugify(value));
    }
  };

  return (
    <Card className="rounded-ds-xl lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          {editingId ? "Edit Plan" : "Create Plan"}
        </CardTitle>
        <CardDescription>
          Plans are purchased with credits by company admins.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={draft.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Managed Delivery"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input
            value={draft.slug}
            onChange={(e) => updateField("slug", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input
            value={draft.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label>Credits</Label>
            <Input
              type="number"
              min="0"
              value={draft.priceCredits}
              onChange={(e) => updateField("priceCredits", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Days</Label>
            <Input
              type="number"
              min="1"
              value={draft.durationDays}
              onChange={(e) => updateField("durationDays", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Partner %</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={draft.partnerCommissionPercent}
              onChange={(e) =>
                updateField("partnerCommissionPercent", e.target.value)
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={isSaving}
            onClick={onSave}
          >
            {editingId ? "Save Changes" : "Create Plan"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
