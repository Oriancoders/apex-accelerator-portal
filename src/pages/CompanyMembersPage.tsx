import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Building2, UserPlus, Users, Trash2 } from "lucide-react";

type MembershipRow = Tables<"company_memberships">;
type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;
const ADD_MEMBER_ROLES = ["admin", "member"] as const;

export default function CompanyMembersPage() {
  const { user } = useAuth();
  const { activeCompany, activeMembership } = useAgentTenant();
  const queryClient = useQueryClient();

  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<(typeof ADD_MEMBER_ROLES)[number]>("member");
  const [memberToDelete, setMemberToDelete] = useState<MembershipRow | null>(null);

  const canManage = !!activeCompany;

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ["company-memberships-manage", activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany?.id) return [];
      const { data, error } = await supabase
        .from("company_memberships")
        .select("id, company_id, user_id, role, is_primary, invited_by, created_at, updated_at")
        .eq("company_id", activeCompany.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MembershipRow[];
    },
    enabled: !!activeCompany?.id,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["company-members-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
    enabled: canManage,
  });

  const profileByUserId = useMemo(() => {
    const map: Record<string, ProfileRow> = {};
    allProfiles.forEach((p) => {
      map[p.user_id] = p;
    });
    return map;
  }, [allProfiles]);

  const memberUserIds = useMemo(() => memberships.map((m) => m.user_id), [memberships]);

  const addableProfiles = useMemo(() => {
    const memberSet = new Set(memberUserIds);
    return allProfiles.filter((p) => !memberSet.has(p.user_id));
  }, [allProfiles, memberUserIds]);

  const ownerCount = useMemo(
    () => memberships.filter((m) => m.role === "owner").length,
    [memberships]
  );

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!activeCompany?.id) throw new Error("No active company selected");
      if (!newUserId) throw new Error("Select a user to add");

      const payload: TablesInsert<"company_memberships"> = {
        company_id: activeCompany.id,
        user_id: newUserId,
        role: newRole,
        invited_by: user?.id || null,
      };

      const { error } = await supabase.from("company_memberships").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added successfully");
      setNewUserId("");
      setNewRole("member");
      queryClient.invalidateQueries({ queryKey: ["company-memberships-manage", activeCompany?.id] });
      // Invalidate agent tickets if this user is in an agent's view
      queryClient.invalidateQueries({ queryKey: ["agent-company-tickets"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      const { error } = await supabase
        .from("company_memberships")
        .update({ role })
        .eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member role updated");
      queryClient.invalidateQueries({ queryKey: ["company-memberships-manage", activeCompany?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("company_memberships").delete().eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["company-memberships-manage", activeCompany?.id] });
      // Invalidate agent tickets if this user was in an agent's view
      queryClient.invalidateQueries({ queryKey: ["agent-company-tickets"] });
      setMemberToDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto space-y-5 py-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Company Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage access for your currently active company workspace.
          </p>
        </div>

        {!activeCompany && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>No active company selected</CardTitle>
              <CardDescription>Switch or create a company first to manage members.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {activeCompany && (
          <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Active Company
              </CardTitle>
              <CardDescription>{activeCompany.name} ({activeCompany.slug})</CardDescription>
            </CardHeader>
          </Card>
        )}

        {activeCompany && canManage && (
          <>
            <Card className="rounded-2xl">
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
                  onChange={(e) => setNewRole(e.target.value as (typeof ADD_MEMBER_ROLES)[number])}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="member">member</option>
                  <option value="admin">companyAdmin</option>
                </select>

                <div className="sm:col-span-3 flex justify-end">
                  <Button
                    className="h-11 rounded-xl"
                    disabled={addMemberMutation.isPending || !newUserId}
                    onClick={() => addMemberMutation.mutate()}
                  >
                    Add Member
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Current Members
                </CardTitle>
                <CardDescription>
                  Change role or remove company access for members.
                </CardDescription>
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
                                    setMemberToDelete(membership);
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
          </>
        )}

        <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Company Member?</AlertDialogTitle>
              <AlertDialogDescription>
                This user will lose access to your active company workspace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (memberToDelete) removeMemberMutation.mutate(memberToDelete.id);
                }}
              >
                Remove Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedLayout>
  );
}
