import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Coins, Clock, Ticket, Calendar, CreditCard, BarChart3, TrendingUp, FileText,
  Building2, Mail, ArrowUpRight, ArrowDownRight, CheckCircle
} from "lucide-react";
import { useProfileData, useProfileUpdate, usePasswordChange } from "./hooks";
import { calculateStats, getMemberSince, getInitials } from "./utils";
import { PersonalInfoForm } from "./components/PersonalInfoForm";
import { ChangePasswordForm } from "./components/ChangePasswordForm";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function ProfilePage() {
  const { user, profile, isGuest } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const { tickets, transactions, reviews } = useProfileData(user?.id);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const updateMutation = useProfileUpdate(user?.id);
  const handlePasswordChange = usePasswordChange();

  if (isGuest) return <Navigate to="/dashboard" replace />;

  if (roleLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
      </ProtectedLayout>
    );
  }

  const isMemberOnly = role === "member";
  const stats = calculateStats(tickets, transactions, reviews);
  const memberSince = getMemberSince(profile?.created_at);
  const initials = getInitials(profile?.full_name);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div {...fadeIn}>
          <div className="relative rounded-ds-xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-8 sm:px-10">
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
                  {!isMemberOnly && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {!isMemberOnly && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Total Tickets", value: stats.totalTickets, icon: Ticket, color: "text-primary", bg: "bg-primary/5" },
              { label: "Hours Worked", value: stats.totalHoursWorked, icon: Clock, color: "text-accent", bg: "bg-accent/5" },
              { label: "Credits Spent", value: stats.totalCreditsSpent, icon: CreditCard, color: "text-destructive", bg: "bg-destructive/5" },
              { label: "Avg Rating", value: stats.avgRating, icon: TrendingUp, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5" },
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
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={isMemberOnly ? "lg:col-span-3 space-y-6" : "lg:col-span-1 space-y-6"}>
            <PersonalInfoForm
              form={form}
              onFormChange={setForm}
              onSubmit={() => updateMutation.mutate({ full_name: form.full_name, phone: form.phone })}
              isPending={updateMutation.isPending}
            />

            {!isMemberOnly && (
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
                    <span className="text-sm font-semibold text-foreground">{stats.totalCreditsPurchased}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total Spent</span>
                    <span className="text-sm font-semibold text-destructive">{stats.totalCreditsSpent}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {(!profile?.auth_provider || profile.auth_provider === "email") && (
              <ChangePasswordForm onSubmit={handlePasswordChange} />
            )}
          </div>

          {!isMemberOnly && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Ticket Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Submitted", value: stats.ticketsByStatus.submitted, color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" },
                      { label: "Under Review", value: stats.ticketsByStatus.under_review, color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" },
                      { label: "Approved", value: stats.ticketsByStatus.approved, color: "bg-primary/10 text-primary" },
                      { label: "In Progress", value: stats.ticketsByStatus.in_progress, color: "bg-accent/10 text-accent" },
                      { label: "UAT", value: stats.ticketsByStatus.uat, color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]" },
                      { label: "Completed", value: stats.ticketsByStatus.completed, color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
                      { label: "Cancelled", value: stats.ticketsByStatus.cancelled, color: "bg-destructive/10 text-destructive" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-ds-md p-3 ${s.color.split(" ")[0]}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.color.split(" ")[1]}`}>{s.label}</p>
                        <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">By Priority</p>
                    <div className="flex gap-2">
                      {[
                        { label: "Low", value: stats.ticketsByPriority.low, color: "bg-muted" },
                        { label: "Medium", value: stats.ticketsByPriority.medium, color: "bg-[hsl(var(--warning))]/15" },
                        { label: "High", value: stats.ticketsByPriority.high, color: "bg-destructive/10" },
                        { label: "Critical", value: stats.ticketsByPriority.critical, color: "bg-destructive/20" },
                      ].map((p) => (
                        <div key={p.label} className={`flex-1 rounded-ds-md p-3 text-center ${p.color}`}>
                          <p className="text-[10px] font-semibold text-muted-foreground">{p.label}</p>
                          <p className="text-lg font-bold text-foreground">{p.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Service Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-ds-md bg-muted/50">
                      <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stats.totalHoursWorked}</p>
                      <p className="text-xs text-muted-foreground">Total Hours Worked</p>
                    </div>
                    <div className="text-center p-4 rounded-ds-md bg-muted/50">
                      <CheckCircle className="h-6 w-6 mx-auto text-[hsl(var(--success))] mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stats.completedTickets}</p>
                      <p className="text-xs text-muted-foreground">Completed Projects</p>
                    </div>
                    <div className="text-center p-4 rounded-ds-md bg-muted/50">
                      <Ticket className="h-6 w-6 mx-auto text-accent mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stats.activeTickets}</p>
                      <p className="text-xs text-muted-foreground">Active Tickets</p>
                    </div>
                    <div className="text-center p-4 rounded-ds-md bg-muted/50">
                      <CreditCard className="h-6 w-6 mx-auto text-destructive mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stats.totalCreditsSpent}</p>
                      <p className="text-xs text-muted-foreground">Credits Used</p>
                    </div>
                    <div className="text-center p-4 rounded-ds-md bg-muted/50">
                      <TrendingUp className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stats.avgRating}</p>
                      <p className="text-xs text-muted-foreground">Avg Satisfaction</p>
                    </div>
                    <div className="text-center p-4 rounded-ds-md bg-muted/50">
                      <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
                      <p className="text-xs text-muted-foreground">Reviews Given</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-ds-md bg-muted/30 hover:bg-muted/50 transition-colors">
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
                        <div key={ticket.id} className="flex items-center justify-between p-3 rounded-ds-md bg-muted/30 hover:bg-muted/50 transition-colors">
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
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
