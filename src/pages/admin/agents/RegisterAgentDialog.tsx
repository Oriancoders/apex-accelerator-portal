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
import type { ProfileLite } from "@/pages/admin/agents/types";

type RegisterAgentDialogProps = {
  open: boolean;
  selectedUserId: string;
  commissionPercent: string;
  candidateProfiles: ProfileLite[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectedUserChange: (value: string) => void;
  onCommissionPercentChange: (value: string) => void;
  onCreate: () => void;
};

export default function RegisterAgentDialog({
  open,
  selectedUserId,
  commissionPercent,
  candidateProfiles,
  isPending,
  onOpenChange,
  onSelectedUserChange,
  onCommissionPercentChange,
  onCreate,
}: RegisterAgentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-ds-xl">
        <DialogHeader>
          <DialogTitle>Register New Partner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Select user account</Label>
            <select
              className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
              value={selectedUserId}
              onChange={(e) => onSelectedUserChange(e.target.value)}
            >
              <option value="">Choose a user...</option>
              {candidateProfiles.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {(p.full_name || "Unnamed")} - {p.email || "No email"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Default commission (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionPercent}
              onChange={(e) => onCommissionPercentChange(e.target.value)}
              className="h-11 rounded-ds-md"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-ds-md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-ds-md" disabled={!selectedUserId || isPending} onClick={onCreate}>
            Create Partner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
