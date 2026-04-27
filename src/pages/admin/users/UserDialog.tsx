import { Coins, Minus, Plus } from "lucide-react";
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
import { ASSIGNABLE_ROLES, type AppRole, type Profile } from "@/pages/admin/users/types";

type UserDialogProps = {
  user: Profile | null;
  selectedRole: AppRole | "";
  creditAdjust: string;
  creditReason: string;
  updateRolePending: boolean;
  adjustCreditsPending: boolean;
  deleteUserPending: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onRoleChange: (role: AppRole) => void;
  onSaveRole: () => void;
  onCreditAdjustChange: (value: string) => void;
  onCreditReasonChange: (value: string) => void;
  onAdjustCredits: (positive: boolean) => void;
  onDeleteUser: () => void;
  getCompanyLabel: (user: Profile) => string;
};

export default function UserDialog({
  user,
  selectedRole,
  creditAdjust,
  creditReason,
  updateRolePending,
  adjustCreditsPending,
  deleteUserPending,
  onOpenChange,
  onClose,
  onRoleChange,
  onSaveRole,
  onCreditAdjustChange,
  onCreditReasonChange,
  onAdjustCredits,
  onDeleteUser,
  getCompanyLabel,
}: UserDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-ds-xl mx-4 sm:mx-auto">
        {user && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">{user.full_name || user.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                <div className="p-3 rounded-ds-md bg-muted/50"><span className="text-muted-foreground">Email:</span> {user.email}</div>
                <div className="p-3 rounded-ds-md bg-muted/50"><span className="text-muted-foreground">Company:</span> {getCompanyLabel(user)}</div>
                <div className="p-3 rounded-ds-md bg-muted/50"><span className="text-muted-foreground">Phone:</span> {user.phone || "—"}</div>
                <div className="p-3 rounded-ds-md bg-muted/50">
                  <span className="text-muted-foreground">Credits:</span> <span className="font-bold text-accent">{user.credits}</span>
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Role</h4>
                <div>
                  <Label className="text-sm">Assigned Role</Label>
                  <select
                    value={selectedRole}
                    onChange={(e) => onRoleChange(e.target.value as AppRole)}
                    className="mt-1 h-11 w-full rounded-ds-md border border-input bg-background px-3 text-sm"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role === "company_admin"
                          ? "companyAdmin"
                          : role === "consultant"
                            ? "Consultant"
                            : role === "agent"
                              ? "Partner"
                              : role}
                      </option>
                    ))}
                  </select>
                </div>
                <Button className="h-11 rounded-ds-md" disabled={!selectedRole || updateRolePending} onClick={onSaveRole}>
                  {updateRolePending ? "Saving..." : "Save Role"}
                </Button>
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Adjust Credits</h4>
                <div>
                  <Label className="text-sm">Amount</Label>
                  <Input
                    type="number"
                    value={creditAdjust}
                    onChange={(e) => onCreditAdjustChange(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    className="h-11 rounded-ds-md mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Reason</Label>
                  <Input
                    value={creditReason}
                    onChange={(e) => onCreditReasonChange(e.target.value)}
                    placeholder="Reason for adjustment"
                    className="h-11 rounded-ds-md mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-ds-md text-[hsl(var(--success))]"
                    onClick={() => onAdjustCredits(true)}
                    disabled={!creditAdjust || adjustCreditsPending}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-ds-md text-destructive"
                    onClick={() => onAdjustCredits(false)}
                    disabled={!creditAdjust || adjustCreditsPending}
                  >
                    <Minus className="h-4 w-4 mr-1" /> Deduct
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!user) return;
                  const ok = window.confirm("Delete this user account permanently? This action cannot be undone.");
                  if (ok) onDeleteUser();
                }}
                className="rounded-ds-md mr-auto"
                disabled={deleteUserPending}
              >
                {deleteUserPending ? "Deleting..." : "Delete User"}
              </Button>
              <Button variant="outline" onClick={onClose} className="rounded-ds-md">Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
