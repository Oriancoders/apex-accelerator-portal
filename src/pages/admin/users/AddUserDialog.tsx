import { Mail, UserPlus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminRegisterUserRole } from "@/lib/admin-register-user";

type AddUserDialogProps = {
  open: boolean;
  fullName: string;
  email: string;
  role: AdminRegisterUserRole;
  commissionPercent: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: AdminRegisterUserRole) => void;
  onCommissionPercentChange: (value: string) => void;
  onSubmit: () => void;
};

export default function AddUserDialog({
  open,
  fullName,
  email,
  role,
  commissionPercent,
  isPending,
  onOpenChange,
  onFullNameChange,
  onEmailChange,
  onRoleChange,
  onCommissionPercentChange,
  onSubmit,
}: AddUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-ds-xl sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-ds-md border border-primary/20 bg-primary/5 p-3">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div className="space-y-1">
                <p><strong className="text-foreground">New accounts:</strong> Get a secure password setup link by email</p>
                <p><strong className="text-foreground">Existing accounts:</strong> Receive a reset link before role access is saved</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-add-user-name" className="text-xs font-medium">Name *</Label>
              <Input
                id="admin-add-user-name"
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
                placeholder="Jane Smith"
                className="h-10 rounded-ds-md"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-add-user-email" className="text-xs font-medium">Email Address *</Label>
              <Input
                id="admin-add-user-email"
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="user@company.com"
                className="h-10 rounded-ds-md"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-add-user-role" className="text-xs font-medium">Starting Role</Label>
              <Select value={role} onValueChange={(value) => onRoleChange(value as AdminRegisterUserRole)} disabled={isPending}>
                <SelectTrigger id="admin-add-user-role" className="h-10 rounded-ds-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="agent">Partner</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "agent" && (
              <div className="space-y-1.5">
                <Label htmlFor="admin-add-user-commission" className="text-xs font-medium">Default Commission (%)</Label>
                <Input
                  id="admin-add-user-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commissionPercent}
                  onChange={(event) => onCommissionPercentChange(event.target.value)}
                  className="h-10 rounded-ds-md"
                  disabled={isPending}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-ds-md" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="rounded-ds-md gap-2"
            disabled={isPending || !fullName.trim() || !email.trim()}
            onClick={onSubmit}
          >
            {isPending ? "Sending reset email..." : "Send Reset Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
