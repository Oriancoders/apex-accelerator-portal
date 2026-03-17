import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Coins, Edit, Plus, Minus, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type AppRole = "admin" | "company_admin" | "agent" | "member";
type UserCompanyMembershipRow = {
  user_id: string;
  is_primary: boolean;
  companies: { name: string } | null;
};

const ROLE_PRIORITY: Record<string, number> = {
  admin: 1,
  company_admin: 2,
  agent: 3,
  member: 4,
};

const ASSIGNABLE_ROLES: AppRole[] = ["admin", "company_admin", "agent", "member"];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [creditAdjust, setCreditAdjust] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as Profile[];
    },
  });

  const userIds = useMemo(() => users.map((u) => u.user_id), [users]);

  const { data: userCompanyMemberships = [] } = useQuery({
    queryKey: ["admin-user-company-memberships", userIds],
    queryFn: async () => {
      if (!userIds.length) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select("user_id, is_primary, companies:company_id(name)")
        .in("user_id", userIds)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      return (data || []) as UserCompanyMembershipRow[];
    },
    enabled: userIds.length > 0,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as { user_id: string; role: string; created_at: string }[];
    },
  });

  const roleByUserId = useMemo(() => {
    const map = new Map<string, AppRole>();

    userRoles.forEach((row) => {
      if (!ASSIGNABLE_ROLES.includes(row.role as AppRole)) return;
      const nextRole = row.role as AppRole;
      const currentRole = map.get(row.user_id);

      if (!currentRole || ROLE_PRIORITY[nextRole] < ROLE_PRIORITY[currentRole]) {
        map.set(row.user_id, nextRole);
      }
    });

    return map;
  }, [userRoles]);

  const companyNameByUserId = useMemo(() => {
    const map = new Map<string, string>();

    userCompanyMemberships.forEach((row) => {
      const companyName = row.companies?.name;
      if (!companyName) return;
      if (!map.has(row.user_id)) {
        map.set(row.user_id, companyName);
      }
    });

    return map;
  }, [userCompanyMemberships]);

  useEffect(() => {
    if (!selectedUser) {
      setSelectedRole("");
      return;
    }

    setSelectedRole(roleByUserId.get(selectedUser.user_id) || "member");
  }, [selectedUser, roleByUserId]);

  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      const { data, error } = await supabase.rpc("admin_adjust_credits", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason || "Admin adjustment",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Credits adjusted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUser(null);
      setCreditAdjust("");
      setCreditReason("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAdjustCredits = (positive: boolean) => {
    if (!selectedUser || !creditAdjust) return;
    const amount = Math.abs(parseFloat(creditAdjust)) * (positive ? 1 : -1);
    adjustCreditsMutation.mutate({ userId: selectedUser.user_id, amount, reason: creditReason });
  };

  const getCompanyLabel = (u: Profile) => companyNameByUserId.get(u.user_id) || u.company || "—";

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      getCompanyLabel(u).toLowerCase().includes(q)
    );
  });

  const roleBadgeVariant = (role: AppRole | undefined) => {
    if (role === "admin") return "default" as const;
    if (role === "company_admin") return "secondary" as const;
    if (role === "agent") return "outline" as const;
    return "secondary" as const;
  };

  const roleLabel = (role: AppRole | undefined) => {
    if (!role) return "member";
    if (role === "company_admin") return "companyAdmin";
    if (role === "agent") return "Partner";
    return role;
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Manage Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="px-4 sm:px-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl" />
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                          <TableCell className="text-sm">{user.email || "—"}</TableCell>
                          <TableCell className="text-sm">{getCompanyLabel(user)}</TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariant(roleByUserId.get(user.user_id))} className="capitalize">
                              {roleLabel(roleByUserId.get(user.user_id))}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-accent/10 text-accent">
                              <Coins className="h-3 w-3 mr-1" />{user.credits}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{user.auth_provider || "email"}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSelectedUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden space-y-2 px-4">
                  {filtered.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                        <Badge variant="outline" className="bg-accent/10 text-accent text-xs">
                          <Coins className="h-3 w-3 mr-1" />{user.credits}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={roleBadgeVariant(roleByUserId.get(user.user_id))} className="text-[10px] capitalize">
                          {roleLabel(roleByUserId.get(user.user_id))}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">{user.auth_provider || "email"}</Badge>
                        <span className="text-xs text-muted-foreground">{getCompanyLabel(user)}</span>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No users found
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="rounded-2xl mx-4 sm:mx-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">{selectedUser.full_name || selectedUser.email}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                  <div className="p-3 rounded-xl bg-muted/50"><span className="text-muted-foreground">Email:</span> {selectedUser.email}</div>
                  <div className="p-3 rounded-xl bg-muted/50"><span className="text-muted-foreground">Company:</span> {getCompanyLabel(selectedUser)}</div>
                  <div className="p-3 rounded-xl bg-muted/50"><span className="text-muted-foreground">Phone:</span> {selectedUser.phone || "—"}</div>
                  <div className="p-3 rounded-xl bg-muted/50"><span className="text-muted-foreground">Credits:</span> <span className="font-bold text-accent">{selectedUser.credits}</span></div>
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Role</h4>
                  <div>
                    <Label className="text-sm">Assigned Role</Label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role === "company_admin" ? "companyAdmin" : role === "agent" ? "Partner" : role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    className="h-11 rounded-xl"
                    disabled={!selectedRole || updateRoleMutation.isPending}
                    onClick={() => {
                      if (!selectedRole) return;
                      updateRoleMutation.mutate({
                        userId: selectedUser.user_id,
                        role: selectedRole,
                      });
                    }}
                  >
                    {updateRoleMutation.isPending ? "Saving..." : "Save Role"}
                  </Button>
                </div>
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Adjust Credits</h4>
                  <div>
                    <Label className="text-sm">Amount</Label>
                    <Input type="number" value={creditAdjust} onChange={(e) => setCreditAdjust(e.target.value)} placeholder="Enter amount" min="1" className="h-11 rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Reason</Label>
                    <Input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="Reason for adjustment" className="h-11 rounded-xl mt-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-11 rounded-xl text-[hsl(var(--success))]" onClick={() => handleAdjustCredits(true)} disabled={!creditAdjust || adjustCreditsMutation.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                    <Button variant="outline" className="flex-1 h-11 rounded-xl text-destructive" onClick={() => handleAdjustCredits(false)} disabled={!creditAdjust || adjustCreditsMutation.isPending}>
                      <Minus className="h-4 w-4 mr-1" /> Deduct
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedUser(null)} className="rounded-xl">Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
