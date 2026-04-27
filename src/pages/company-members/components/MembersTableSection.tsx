import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { MembershipRow, ProfileRow } from "../types";

interface MembersTableSectionProps {
  memberships: MembershipRow[];
  profileByUserId: Record<string, ProfileRow>;
  isLoading: boolean;
  ownerCount: number;
  updateRoleMutation: any;
  onDeleteClick: (membership: MembershipRow) => void;
}

export function MembersTableSection({
  memberships,
  profileByUserId,
  isLoading,
  ownerCount,
  updateRoleMutation,
  onDeleteClick,
}: MembersTableSectionProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Current Access
        </CardTitle>
        <CardDescription>
          Change role or remove company access for members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
                          onChange={(e) =>
                            updateRoleMutation.mutate({ membershipId: membership.id, role: e.target.value })
                          }
                          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                          disabled={updateRoleMutation.isPending}
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
                          onClick={() => {
                            if (membership.role === "owner" && ownerCount <= 1) {
                              toast.error("At least one owner must remain");
                              return;
                            }
                            onDeleteClick(membership);
                          }}
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
