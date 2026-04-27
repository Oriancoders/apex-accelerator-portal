import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADD_MEMBER_ROLES, type AddMemberRole, type CompanyRow } from "@/pages/admin/company-members/types";

type AddMemberCardProps = {
  selectedCompany: CompanyRow;
  newMemberName: string;
  newMemberEmail: string;
  newRole: AddMemberRole;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (value: AddMemberRole) => void;
  onAdd: () => void;
};

export default function AddMemberCard({
  selectedCompany,
  newMemberName,
  newMemberEmail,
  newRole,
  isPending,
  onNameChange,
  onEmailChange,
  onRoleChange,
  onAdd,
}: AddMemberCardProps) {
  return (
    <Card className="rounded-ds-xl border-primary/20 bg-primary/3">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Add Team Member
        </CardTitle>
        <CardDescription>
          Invite someone to {selectedCompany.name}. They will receive a password setup email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info box */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-ds-md flex gap-3">
          <Mail className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">New accounts:</strong> Get a secure password setup link by email</p>
            <p><strong className="text-foreground">Existing accounts:</strong> Receive a reset link before access is saved</p>
            <p><strong className="text-foreground">Details saved:</strong> Name, email, and role are stored after the email is sent</p>
          </div>
        </div>

        {/* Form */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="admin-add-member-name" className="text-xs font-medium">Name *</Label>
            <Input
              id="admin-add-member-name"
              placeholder="Jane Smith"
              className="h-10 rounded-ds-md"
              value={newMemberName}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-add-member-email" className="text-xs font-medium">Email Address *</Label>
            <Input
              id="admin-add-member-email"
              type="email"
              placeholder="user@company.com"
              className="h-10 rounded-ds-md"
              value={newMemberEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-add-member-role" className="text-xs font-medium">Role</Label>
            <Select
              value={newRole}
              onValueChange={(value) => {
                if (ADD_MEMBER_ROLES.includes(value as AddMemberRole)) {
                  onRoleChange(value as AddMemberRole);
                }
              }}
              disabled={isPending}
            >
              <SelectTrigger id="admin-add-member-role" className="h-10 rounded-ds-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <Button
              onClick={onAdd}
              disabled={isPending || !newMemberName.trim() || !newMemberEmail.trim()}
              className="h-10 rounded-ds-md gap-2"
            >
              {isPending ? "Sending reset email..." : "Send Reset Email"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
