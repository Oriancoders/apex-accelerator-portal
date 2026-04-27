import { Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CompanyRow, MembershipRow, ProfileRow } from "@/pages/admin/company-members/types";

type MembersTableCardProps = {
  selectedCompany: CompanyRow;
  memberships: MembershipRow[];
  membershipsLoading: boolean;
  profileByUserId: Record<string, ProfileRow>;
  updateRolePending: boolean;
  onRoleChange: (args: { membershipId: string; role: string }) => void;
  onRemoveClick: (membership: MembershipRow) => void;
};

export default function MembersTableCard({
  selectedCompany,
  memberships,
  membershipsLoading,
  profileByUserId,
  updateRolePending,
  onRoleChange,
  onRemoveClick,
}: MembersTableCardProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Current Access
          </CardTitle>
          <Badge variant="outline" className="text-[11px]">{selectedCompany.status}</Badge>
        </div>
        <CardDescription>Manage people and roles for this company.</CardDescription>
      </CardHeader>
      <CardContent>
        {membershipsLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading members...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => {
                  const profile = profileByUserId[membership.user_id];
                  return (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {profile?.full_name || "Unnamed User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profile?.email || membership.user_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <select
                          value={membership.role === "admin" ? "admin" : "member"}
                          onChange={(e) => onRoleChange({ membershipId: membership.id, role: e.target.value })}
                          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                          disabled={updateRolePending}
                        >
                          <option value="member">member</option>
                          <option value="admin">companyAdmin</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {membership.is_primary ? (
                          <Badge className="text-[11px]">Yes</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-destructive"
                          onClick={() => onRemoveClick(membership)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {memberships.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      No members in this company yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
