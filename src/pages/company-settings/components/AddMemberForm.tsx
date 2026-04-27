import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { AddMemberRole } from "../types";

interface AddMemberFormProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  role: AddMemberRole;
  setRole: (v: AddMemberRole) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function AddMemberForm({
  name,
  setName,
  email,
  setEmail,
  role,
  setRole,
  isPending,
  onSubmit,
}: AddMemberFormProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" /> Add Member
        </CardTitle>
        <CardDescription>
          Enter a name and email. The user receives a password setup email before access is saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Member name"
            className="flex-1 h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
            maxLength={120}
            autoComplete="name"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@email.com"
            className="flex-1 h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
            maxLength={254}
            autoComplete="email"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AddMemberRole)}
            className="h-11 rounded-ds-md border border-input bg-background px-3 text-sm w-full sm:w-32"
          >
            <option value="member">member</option>
            <option value="admin">companyAdmin</option>
          </select>
          <Button
            className="h-11 rounded-ds-md px-5"
            disabled={isPending || !name.trim() || !email.trim()}
            onClick={onSubmit}
          >
            Send
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Details are saved after the reset email is sent successfully.
        </p>
      </CardContent>
    </Card>
  );
}
