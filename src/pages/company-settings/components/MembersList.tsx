import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { MembershipRow, ProfileRow } from "../types";

interface MembersListProps {
  memberships: MembershipRow[];
  profileByUserId: Record<string, ProfileRow>;
  isLoading: boolean;
  canManage: boolean;
  ownerCount: number;
  updateRoleMutation: any;
  onDeleteClick: (membership: MembershipRow) => void;
}

export function MembersList({
  memberships,
  profileByUserId,
  isLoading,
  canManage,
  ownerCount,
  updateRoleMutation,
  onDeleteClick,
}: MembersListProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Team Access ({memberships.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
        ) : memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No members yet</p>
        ) : (
          <div className="space-y-2">
            {memberships.map((membership) => {
              const profile = profileByUserId[membership.user_id];
              return (
                <div
                  key={membership.id}
                  className="flex items-center gap-3 rounded-ds-md border border-border-subtle px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile?.full_name || "Unnamed User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email || membership.user_id}</p>
                  </div>
                  {membership.is_primary && (
                    <Badge className="text-[10px] flex-shrink-0">Primary</Badge>
                  )}
                  {canManage ? (
                    <select
                      value={membership.role === "admin" ? "admin" : "member"}
                      onChange={(e) =>
                        updateRoleMutation.mutate({ membershipId: membership.id, role: e.target.value })
                      }
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs flex-shrink-0"
                      disabled={updateRoleMutation.isPending}
                    >
                      <option value="member">member</option>
                      <option value="admin">companyAdmin</option>
                    </select>
                  ) : (
                    <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">{membership.role}</Badge>
                  )}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => {
                        if (membership.role === "owner" && ownerCount <= 1) {
                          toast.error("At least one owner must remain");
                          return;
                        }
                        onDeleteClick(membership);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
