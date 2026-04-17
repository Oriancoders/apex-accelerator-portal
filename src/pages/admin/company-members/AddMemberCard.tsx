import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ADD_MEMBER_ROLES, type AddMemberRole, type CompanyRow, type ProfileRow } from "@/pages/admin/company-members/types";

type AddMemberCardProps = {
  selectedCompany: CompanyRow;
  newUserId: string;
  newRole: AddMemberRole;
  addableProfiles: ProfileRow[];
  isPending: boolean;
  onUserChange: (value: string) => void;
  onRoleChange: (value: AddMemberRole) => void;
  onAdd: () => void;
};

export default function AddMemberCard({
  selectedCompany,
  newUserId,
  newRole,
  addableProfiles,
  isPending,
  onUserChange,
  onRoleChange,
  onAdd,
}: AddMemberCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Add Member
        </CardTitle>
        <CardDescription>
          Add a user to {selectedCompany.name}. They will get the selected company role.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <select
          value={newUserId}
          onChange={(e) => onUserChange(e.target.value)}
          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm sm:col-span-2"
        >
          <option value="">Select user...</option>
          {addableProfiles.map((profile) => (
            <option key={profile.user_id} value={profile.user_id}>
              {(profile.full_name || "Unnamed User") + " - " + (profile.email || "no-email")}
            </option>
          ))}
        </select>

        <select
          value={newRole}
          onChange={(e) => {
            const role = e.target.value;
            if (ADD_MEMBER_ROLES.includes(role as AddMemberRole)) {
              onRoleChange(role as AddMemberRole);
            }
          }}
          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="member">member</option>
          <option value="admin">companyAdmin</option>
        </select>

        <div className="sm:col-span-3 flex justify-end">
          <Button
            className="h-11 rounded-xl"
            disabled={isPending || !newUserId}
            onClick={onAdd}
          >
            Add Member
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
