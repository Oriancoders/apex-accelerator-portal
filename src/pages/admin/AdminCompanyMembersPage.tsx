import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
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

type CompanyRow = Pick<Tables<"companies">, "id" | "name" | "slug" | "status">;
type MembershipRow = Tables<"company_memberships">;
type ProfileRow = Pick<Tables<"profiles">, "user_id" | "full_name" | "email">;

const ADD_MEMBER_ROLES = ["admin", "member"] as const;

export default function AdminCompanyMembersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [companyId, setCompanyId] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<(typeof ADD_MEMBER_ROLES)[number]>("member");
  const [memberToDelete, setMemberToDelete] = useState<MembershipRow | null>(null);

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["admin-members-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, status")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as CompanyRow[];
    },
  });

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ["admin-company-memberships", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_memberships")
        .select("id, company_id, user_id, role, is_primary, invited_by, created_at, updated_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MembershipRow[];
    },
    enabled: !!companyId,
  });

  const memberUserIds = useMemo(() => memberships.map((m) => m.user_id), [memberships]);

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-members-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
  });

  const profileByUserId = useMemo(() => {
    const map: Record<string, ProfileRow> = {};
    allProfiles.forEach((p) => {
      map[p.user_id] = p;
    });
    return map;
  }, [allProfiles]);

  const addableProfiles = useMemo(() => {
    const memberSet = new Set(memberUserIds);
    return allProfiles.filter((p) => !memberSet.has(p.user_id));
  }, [allProfiles, memberUserIds]);

  const ownerCount = useMemo(
    () => memberships.filter((m) => m.role === "owner").length,
    [memberships]
  );

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId) || null,
    [companies, companyId]
  );

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Select a company first");
      if (!newUserId) throw new Error("Select a user to add");

      const payload: TablesInsert<"company_memberships"> = {
        company_id: companyId,
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
      queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", companyId] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", companyId] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-company-memberships", companyId] });
      setMemberToDelete(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Company Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add users to a company, update their role, or remove access.
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Select Company
            </CardTitle>
            <CardDescription>Choose the tenant company you want to manage.</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
              disabled={companiesLoading}
            >
              <option value="">Select company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.slug})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedCompany && (
          <>
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
                <CardDescription className="flex items-center gap-2">
                  <span>Manage membership roles and access.</span>
                  <Badge variant="outline" className="text-[11px]">{selectedCompany.status}</Badge>
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
                This user will lose access to the selected company workspace.
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
    </AdminLayout>
  );
}
