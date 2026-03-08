import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Coins, Edit, Plus, Minus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
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

  const adjustCreditsMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
      reason,
    }: {
      userId: string;
      amount: number;
      reason: string;
    }) => {
      // Update credits
      const user = users.find((u) => u.user_id === userId);
      if (!user) throw new Error("User not found");
      const newCredits = user.credits + amount;
      if (newCredits < 0) throw new Error("Cannot set negative credits");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("user_id", userId);
      if (updateError) throw updateError;

      // Log transaction
      const { error: txError } = await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount,
        type: amount > 0 ? "admin_credit" : "admin_debit",
        description: reason || "Admin adjustment",
      });
      if (txError) throw txError;
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

  const handleAdjustCredits = (positive: boolean) => {
    if (!selectedUser || !creditAdjust) return;
    const amount = Math.abs(parseInt(creditAdjust)) * (positive ? 1 : -1);
    adjustCreditsMutation.mutate({
      userId: selectedUser.user_id,
      amount,
      reason: creditReason,
    });
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
        <p className="text-muted-foreground text-sm">{users.length} registered users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
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
                    <TableCell className="text-sm">{user.company || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-accent/10 text-accent">
                        <Coins className="h-3 w-3 mr-1" />
                        {user.credits}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {user.auth_provider || "email"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Credit Adjustment Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Manage User: {selectedUser.full_name || selectedUser.email}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span> {selectedUser.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company:</span>{" "}
                    {selectedUser.company || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {selectedUser.phone || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Credits:</span>{" "}
                    <span className="font-bold text-accent">{selectedUser.credits}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-3">Adjust Credits</h4>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={creditAdjust}
                      onChange={(e) => setCreditAdjust(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                    />
                  </div>
                  <div className="mt-2">
                    <Label>Reason</Label>
                    <Input
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      placeholder="Reason for adjustment"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      className="flex-1 text-success"
                      onClick={() => handleAdjustCredits(true)}
                      disabled={!creditAdjust || adjustCreditsMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Credits
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive"
                      onClick={() => handleAdjustCredits(false)}
                      disabled={!creditAdjust || adjustCreditsMutation.isPending}
                    >
                      <Minus className="h-4 w-4 mr-1" /> Deduct Credits
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
