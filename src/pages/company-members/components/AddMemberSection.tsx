import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import type { ProfileRow, AddMemberRole } from "../types";
import { ADD_MEMBER_ROLES } from "../constants";

interface AddMemberSectionProps {
  newUserId: string;
  setNewUserId: (v: string) => void;
  newRole: AddMemberRole;
  setNewRole: (v: AddMemberRole) => void;
  addableProfiles: ProfileRow[];
  mutation: UseMutationResult<void, Error, void, unknown>;
  onSubmit: () => void;
}

export function AddMemberSection({
  newUserId,
  setNewUserId,
  newRole,
  setNewRole,
  addableProfiles,
  mutation,
  onSubmit,
}: AddMemberSectionProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Add Member
        </CardTitle>
        <CardDescription>Invite an existing user profile into this company.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <select
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm sm:col-span-2"
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
          onChange={(e) => setNewRole(e.target.value as AddMemberRole)}
          className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
        >
          <option value="member">member</option>
          <option value="admin">companyAdmin</option>
        </select>

        <div className="sm:col-span-3 flex justify-end">
          <Button
            className="h-11 rounded-ds-md"
            disabled={mutation.isPending || !newUserId}
            onClick={onSubmit}
          >
            Add Member
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
