import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Building2, Coins, Clock, Ticket, CheckCircle,
  TrendingUp, Calendar, CreditCard, BarChart3, Save, AlertTriangle,
  FileText, ArrowUpRight, ArrowDownRight, Loader2, Lock, Eye, EyeOff
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function ProfilePage() {
  const { user, profile, refreshProfile, isGuest } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
  });

  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);


  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        company: profile.company || "",
      });
    }
  }, [profile]);

  // Fetch tickets for stats
  const { data: tickets = [] } = useQuery({
    queryKey: ["profile-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select("id, status, credit_cost, estimated_hours, created_at, priority, difficulty_level, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch credit transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["profile-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["profile-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ticket_reviews")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          company: form.company,
        })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast({ title: "Profile updated successfully" });
    },
    onError: () => toast({ title: "Error updating profile", variant: "destructive" }),
  });

  // Redirect guests — after all hooks
  if (isGuest) return <Navigate to="/dashboard" replace />;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setPasswordLoading(false);
    if (error) {
      toast({ title: "Error changing password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed successfully" });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    }
  };

  // Compute stats
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter((t) => t.status === "completed" || t.status === "closed").length;
  const activeTickets = tickets.filter((t) => !["completed", "closed", "cancelled"].includes(t.status)).length;
  const cancelledTickets = tickets.filter((t) => t.status === "cancelled").length;

  const totalHoursWorked = tickets.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const totalCreditsSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalCreditsPurchased = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating_overall || 0), 0) / reviews.length).toFixed(1)
    : "N/A";

  const ticketsByStatus = {
    submitted: tickets.filter((t) => t.status === "submitted").length,
    under_review: tickets.filter((t) => t.status === "under_review").length,
    approved: tickets.filter((t) => t.status === "approved").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    uat: tickets.filter((t) => t.status === "uat").length,
    completed: tickets.filter((t) => t.status === "completed").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    cancelled: tickets.filter((t) => t.status === "cancelled").length,
  };

  const ticketsByPriority = {
    low: tickets.filter((t) => t.priority === "low").length,
    medium: tickets.filter((t) => t.priority === "medium").length,
    high: tickets.filter((t) => t.priority === "high").length,
    critical: tickets.filter((t) => t.priority === "critical").length,
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const recentTransactions = transactions.slice(0, 5);

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div {...fadeIn}>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-8 sm:px-10">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {profile?.full_name || "User"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge variant="secondary" className="gap-1.5">
                    <Coins className="h-3 w-3" /> {profile?.credits ?? 0} Credits
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <Calendar className="h-3 w-3" /> Member since {memberSince}
                  </Badge>
                  {profile?.company && (
                    <Badge variant="outline" className="gap-1.5">
                      <Building2 className="h-3 w-3" /> {profile.company}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Total Tickets", value: totalTickets, icon: Ticket, color: "text-primary", bg: "bg-primary/5" },
            { label: "Hours Worked", value: totalHoursWorked, icon: Clock, color: "text-accent", bg: "bg-accent/5" },
            { label: "Credits Spent", value: totalCreditsSpent, icon: CreditCard, color: "text-destructive", bg: "bg-destructive/5" },
            { label: "Avg Rating", value: avgRating, icon: TrendingUp, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information - Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input value={form.email} disabled className="mt-1 bg-muted" />
                    <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Your company"
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Auth Provider</span>
                  <Badge variant="outline" className="text-xs capitalize">{profile?.auth_provider || "email"}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Current Credits</span>
                  <span className="text-sm font-bold text-foreground">{profile?.credits ?? 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Purchased</span>
                  <span className="text-sm font-semibold text-foreground">{totalCreditsPurchased}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Spent</span>
                  <span className="text-sm font-semibold text-destructive">{totalCreditsSpent}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics - Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Ticket Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Submitted", value: ticketsByStatus.submitted, color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" },
                    { label: "Under Review", value: ticketsByStatus.under_review, color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" },
                    { label: "Approved", value: ticketsByStatus.approved, color: "bg-primary/10 text-primary" },
                    { label: "In Progress", value: ticketsByStatus.in_progress, color: "bg-accent/10 text-accent" },
                    { label: "UAT", value: ticketsByStatus.uat, color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" },
                    { label: "Completed", value: ticketsByStatus.completed, color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
                    { label: "Closed", value: ticketsByStatus.closed, color: "bg-muted text-muted-foreground" },
                    { label: "Cancelled", value: ticketsByStatus.cancelled, color: "bg-destructive/10 text-destructive" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-3 ${s.color.split(" ")[0]}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.color.split(" ")[1]}`}>{s.label}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Priority breakdown */}
                <div className="mt-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">By Priority</p>
                  <div className="flex gap-2">
                    {[
                      { label: "Low", value: ticketsByPriority.low, color: "bg-muted" },
                      { label: "Medium", value: ticketsByPriority.medium, color: "bg-[hsl(var(--warning))]/15" },
                      { label: "High", value: ticketsByPriority.high, color: "bg-destructive/10" },
                      { label: "Critical", value: ticketsByPriority.critical, color: "bg-destructive/20" },
                    ].map((p) => (
                      <div key={p.label} className={`flex-1 rounded-xl p-3 text-center ${p.color}`}>
                        <p className="text-[10px] font-semibold text-muted-foreground">{p.label}</p>
                        <p className="text-lg font-bold text-foreground">{p.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Service Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">{totalHoursWorked}</p>
                    <p className="text-xs text-muted-foreground">Total Hours Worked</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <CheckCircle className="h-6 w-6 mx-auto text-[hsl(var(--success))] mb-2" />
                    <p className="text-2xl font-bold text-foreground">{completedTickets}</p>
                    <p className="text-xs text-muted-foreground">Completed Projects</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <Ticket className="h-6 w-6 mx-auto text-accent mb-2" />
                    <p className="text-2xl font-bold text-foreground">{activeTickets}</p>
                    <p className="text-xs text-muted-foreground">Active Tickets</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <CreditCard className="h-6 w-6 mx-auto text-destructive mb-2" />
                    <p className="text-2xl font-bold text-foreground">{totalCreditsSpent}</p>
                    <p className="text-xs text-muted-foreground">Credits Used</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <TrendingUp className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">{avgRating}</p>
                    <p className="text-xs text-muted-foreground">Avg Satisfaction</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
                    <p className="text-xs text-muted-foreground">Reviews Given</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" /> Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${tx.amount > 0 ? "bg-[hsl(var(--success))]/10" : "bg-destructive/10"}`}>
                            {tx.amount > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-[hsl(var(--success))]" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{tx.description || tx.type}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${tx.amount > 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" /> Recent Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Ticket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No tickets yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] capitalize">{ticket.status.replace("_", " ")}</Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{ticket.priority}</Badge>
                            {ticket.estimated_hours && (
                              <span className="text-[10px] text-muted-foreground">{ticket.estimated_hours}h</span>
                            )}
                          </div>
                        </div>
                        {ticket.credit_cost && (
                          <span className="text-xs font-semibold text-muted-foreground">{ticket.credit_cost} cr</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
