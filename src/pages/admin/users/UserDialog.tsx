import {
  AlertTriangle,
  BriefcaseBusiness,
  Coins,
  Mail,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleLabel } from "@/pages/admin/users/roleUtils";
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

function roleOptionLabel(role: AppRole) {
  if (role === "company_admin") return "Company Admin";
  if (role === "consultant") return "Consultant";
  if (role === "agent") return "Partner";
  if (role === "admin") return "Admin";
  return "Member";
}

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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-ds-xl mx-4 sm:mx-auto sm:max-w-[640px]">
        {user && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-ds-md bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base sm:text-lg">
                    {user.full_name || user.email || "User"}
                  </DialogTitle>
                  <p className="truncate text-sm text-muted-foreground">{user.email || "No email saved"}</p>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="profile" className="mt-2">
              <TabsList className="grid h-auto w-full grid-cols-4 rounded-ds-md">
                <TabsTrigger value="profile" className="gap-1.5 px-2 text-xs sm:text-sm">
                  <UserRound className="h-3.5 w-3.5" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="role" className="gap-1.5 px-2 text-xs sm:text-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Role
                </TabsTrigger>
                <TabsTrigger value="credits" className="gap-1.5 px-2 text-xs sm:text-sm">
                  <Coins className="h-3.5 w-3.5" />
                  Credits
                </TabsTrigger>
                <TabsTrigger value="danger" className="gap-1.5 px-2 text-xs sm:text-sm">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Danger
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-3 pt-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                    <p className="mt-1 break-words text-sm font-medium text-foreground">{user.email || "No email saved"}</p>
                  </div>
                  <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      Company
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{getCompanyLabel(user)}</p>
                  </div>
                  <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{user.phone || "-"}</p>
                  </div>
                  <div className="rounded-ds-md border border-border-subtle bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Coins className="h-3.5 w-3.5" />
                      Credits
                    </div>
                    <p className="mt-1 text-sm font-bold text-accent">{user.credits}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="role" className="pt-3">
                <div className="rounded-ds-md border border-border-subtle p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold">Assigned Role</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current: {roleLabel(selectedRole || "member")}
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <Label className="text-sm">Role</Label>
                  <select
                    value={selectedRole}
                    onChange={(e) => onRoleChange(e.target.value as AppRole)}
                    className="mt-1 h-11 w-full rounded-ds-md border border-input bg-background px-3 text-sm"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {roleOptionLabel(role)}
                      </option>
                    ))}
                  </select>
                  <Button className="mt-4 h-10 rounded-ds-md" disabled={!selectedRole || updateRolePending} onClick={onSaveRole}>
                    {updateRolePending ? "Saving..." : "Save Role"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="credits" className="pt-3">
                <div className="rounded-ds-md border border-border-subtle p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold">Adjust Credits</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Current balance: <span className="font-semibold text-accent">{user.credits}</span>
                      </p>
                    </div>
                    <Coins className="h-5 w-5 text-accent" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
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
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="h-10 rounded-ds-md text-[hsl(var(--success))]"
                      onClick={() => onAdjustCredits(true)}
                      disabled={!creditAdjust || adjustCreditsPending}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-ds-md text-destructive"
                      onClick={() => onAdjustCredits(false)}
                      disabled={!creditAdjust || adjustCreditsPending}
                    >
                      <Minus className="h-4 w-4 mr-1" /> Deduct
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="danger" className="pt-3">
                <div className="rounded-ds-md border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground">Delete User</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Permanently removes this user account and related admin-managed access.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="mt-4 h-10 rounded-ds-md gap-2" disabled={deleteUserPending}>
                            <Trash2 className="h-4 w-4" />
                            {deleteUserPending ? "Deleting..." : "Delete User"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-ds-xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action permanently deletes {user.full_name || user.email || "this user"}. It cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-ds-md">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-ds-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={onDeleteUser}
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-ds-md">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
