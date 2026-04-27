import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PayoutModel, RuleRow } from "@/pages/admin/agent-assignments/types";

type EditRuleDialogProps = {
  editingRule: RuleRow | null;
  editRuleName: string;
  editPriority: string;
  editPayoutModel: PayoutModel;
  editRulePercent: string;
  editFlatAmount: string;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onEditRuleNameChange: (value: string) => void;
  onEditPriorityChange: (value: string) => void;
  onEditPayoutModelChange: (value: PayoutModel) => void;
  onEditRulePercentChange: (value: string) => void;
  onEditFlatAmountChange: (value: string) => void;
  onSave: () => void;
};

export default function EditRuleDialog({
  editingRule,
  editRuleName,
  editPriority,
  editPayoutModel,
  editRulePercent,
  editFlatAmount,
  isSaving,
  onOpenChange,
  onEditRuleNameChange,
  onEditPriorityChange,
  onEditPayoutModelChange,
  onEditRulePercentChange,
  onEditFlatAmountChange,
  onSave,
}: EditRuleDialogProps) {
  return (
    <Dialog open={!!editingRule} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-ds-xl">
        <DialogHeader>
          <DialogTitle>Edit Commission Rule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rule name</Label>
            <Input className="h-11 rounded-ds-md" value={editRuleName} onChange={(e) => onEditRuleNameChange(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Input className="h-11 rounded-ds-md" type="number" value={editPriority} onChange={(e) => onEditPriorityChange(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Payout model</Label>
            <select
              className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
              value={editPayoutModel}
              onChange={(e) => onEditPayoutModelChange(e.target.value as PayoutModel)}
            >
              <option value="percentage">percentage</option>
              <option value="flat">flat</option>
            </select>
          </div>

          {editPayoutModel === "percentage" ? (
            <div className="space-y-1.5">
              <Label>Commission %</Label>
              <Input className="h-11 rounded-ds-md" type="number" min="0" max="100" step="0.01" value={editRulePercent} onChange={(e) => onEditRulePercentChange(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Flat amount</Label>
              <Input className="h-11 rounded-ds-md" type="number" min="0" step="0.01" value={editFlatAmount} onChange={(e) => onEditFlatAmountChange(e.target.value)} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-ds-md" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-ds-md" onClick={onSave} disabled={isSaving}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
