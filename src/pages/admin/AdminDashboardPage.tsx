import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Ticket, Users, Coins, FileText, TrendingUp, Clock, CheckCircle,
  AlertTriangle, DollarSign, Crown, BarChart3, Activity, MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { subDays, subMonths, isAfter, format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Period = "today" | "week" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(40, 90%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(180, 50%, 45%)",
];

function getStartDate(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "today": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "all": return null;
  }
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("month");

  const { data: rawData } = useQuery({
    queryKey: ["admin-dashboard-data"],
    queryFn: async () => {
      const [ticketsRes, profilesRes, articlesRes, transactionsRes, contactsRes] = await Promise.all([
        supabase.from("tickets").select("id, status, credit_cost, estimated_hours, created_at, user_id, priority, difficulty_level"),
        supabase.from("profiles").select("id, user_id, full_name, email, credits"),
        supabase.from("articles").select("id, published"),
        supabase.from("credit_transactions").select("id, user_id, amount, type, created_at"),
        supabase.from("contact_submissions" as any).select("id, created_at, is_read"),
      ]);
      return {
        tickets: ticketsRes.data || [],
        profiles: profilesRes.data || [],
        articles: articlesRes.data || [],
        transactions: (transactionsRes.data || []) as any[],
        contacts: (contactsRes.data || []) as any[],
      };
    },
  });

  const stats = useMemo(() => {
    if (!rawData) return null;
    const { tickets, profiles, articles, transactions, contacts } = rawData;
    const start = getStartDate(period);

    const filteredTickets = start ? tickets.filter(t => isAfter(new Date(t.created_at), start)) : tickets;
    const filteredTx = start ? transactions.filter((t: any) => isAfter(new Date(t.created_at), start)) : transactions;
    const filteredContacts = start ? contacts.filter((c: any) => isAfter(new Date(c.created_at), start)) : contacts;

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    filteredTickets.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

    // Priority breakdown
    const priorityCounts: Record<string, number> = {};
    filteredTickets.forEach(t => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });

    // Credits spent (negative amounts = deductions)
    const creditsSpent = filteredTx
      .filter((t: any) => t.type === "deduction")
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

    // Credits purchased
    const creditsPurchased = filteredTx
      .filter((t: any) => t.type === "purchase")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Top spenders
    const spendByUser: Record<string, number> = {};
    filteredTx.filter((t: any) => t.type === "deduction").forEach((t: any) => {
      spendByUser[t.user_id] = (spendByUser[t.user_id] || 0) + Math.abs(t.amount);
    });
    const topSpenders = Object.entries(spendByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, amount]) => {
        const profile = profiles.find(p => p.user_id === userId);
        return { name: profile?.full_name || profile?.email || "Unknown", amount };
      });

    // Most active users (by ticket count)
    const ticketsByUser: Record<string, number> = {};
    filteredTickets.forEach(t => {
      ticketsByUser[t.user_id] = (ticketsByUser[t.user_id] || 0) + 1;
    });
    const topActive = Object.entries(ticketsByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const profile = profiles.find(p => p.user_id === userId);
        return { name: profile?.full_name || profile?.email || "Unknown", count };
      });

    // Estimated hours
    const totalHours = filteredTickets.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    // Ticket trend (last 7 days for daily, last 4 weeks for weekly, last 6 months for monthly)
    const ticketTrend: { label: string; count: number }[] = [];
    if (period === "today" || period === "week") {
      const days = period === "today" ? 1 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "yyyy-MM-dd");
        const count = tickets.filter(t => format(new Date(t.created_at), "yyyy-MM-dd") === dayStr).length;
        ticketTrend.push({ label: format(day, "EEE"), count });
      }
    } else if (period === "month") {
      for (let i = 29; i >= 0; i -= 5) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "MMM d");
        const rangeStart = subDays(new Date(), i);
        const rangeEnd = subDays(new Date(), Math.max(i - 5, 0));
        const count = tickets.filter(t => {
          const d = new Date(t.created_at);
          return d >= rangeStart && d <= rangeEnd;
        }).length;
        ticketTrend.push({ label: dayStr, count });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const monthStr = format(month, "yyyy-MM");
        const count = tickets.filter(t => format(new Date(t.created_at), "yyyy-MM") === monthStr).length;
        ticketTrend.push({ label: format(month, "MMM"), count });
      }
    }

    return {
      totalTickets: filteredTickets.length,
      submitted: statusCounts["submitted"] || 0,
      underReview: statusCounts["under_review"] || 0,
      inProgress: statusCounts["in_progress"] || 0,
      completed: (statusCounts["completed"] || 0) + (statusCounts["closed"] || 0),
      totalUsers: profiles.length,
      totalCredits: profiles.reduce((s, p) => s + (p.credits || 0), 0),
      totalArticles: articles.length,
      publishedArticles: articles.filter(a => a.published).length,
      creditsSpent,
      creditsPurchased,
      totalHours,
      topSpenders,
      topActive,
      statusCounts,
      priorityCounts,
      ticketTrend,
      unreadContacts: filteredContacts.filter((c: any) => !c.is_read).length,
      totalContacts: filteredContacts.length,
    };
  }, [rawData, period]);

  const summaryCards = [
    { title: "Tickets", value: stats?.totalTickets ?? 0, icon: Ticket, color: "text-primary", bg: "bg-primary/10" },
    { title: "Credits Spent", value: stats?.creditsSpent ?? 0, icon: DollarSign, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Credits Purchased", value: stats?.creditsPurchased ?? 0, icon: Coins, color: "text-accent", bg: "bg-accent/10" },
    { title: "Est. Hours", value: stats?.totalHours ?? 0, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
    { title: "Completed", value: stats?.completed ?? 0, icon: CheckCircle, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/10" },
    { title: "In Progress", value: stats?.inProgress ?? 0, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { title: "Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { title: "Contact Inquiries", value: stats?.totalContacts ?? 0, sub: stats?.unreadContacts ? `${stats.unreadContacts} unread` : undefined, icon: MessageSquare, color: "text-[hsl(var(--info))]", bg: "bg-[hsl(var(--info))]/10" },
  ];

  const statusPieData = stats ? Object.entries(stats.statusCounts).map(([name, value]) => ({ name: name.replace("_", " "), value })) : [];
  const priorityPieData = stats ? Object.entries(stats.priorityCounts).map(([name, value]) => ({ name, value })) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header & Period Filter (Fitts's Law applied: larger touch targets) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Analytics & insights for the portal</p>
          </motion.div>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-fit">
            <TabsList className="h-auto p-1 border shadow-sm">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <TabsTrigger key={p} value={p} className="px-6 py-2.5 text-sm font-medium transition-colors">
                  {PERIOD_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Modular View (Hick's Law / Chunking applied) */}
        <Tabs defaultValue="overview" className="space-y-6 w-full">
          <TabsList className="h-auto w-full justify-start p-1 bg-muted/40 overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">System Overview</TabsTrigger>
            <TabsTrigger value="operations" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">Operations</TabsTrigger>
            <TabsTrigger value="finance" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">Finance</TabsTrigger>
            <TabsTrigger value="users" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">Users</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 outline-none">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[summaryCards[0], summaryCards[4], summaryCards[6], summaryCards[1]].map((stat, i) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{stat.title}</CardTitle>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                      {(stat as any).sub && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{(stat as any).sub}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Ticket Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Ticket Trend
                  </CardTitle>
                  <CardDescription className="text-xs">{PERIOD_LABELS[period]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.ticketTrend || []}>
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Breakdown Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Ticket Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52 flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                            stroke="none"
                          >
                            {statusPieData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-1.5">
                      {statusPieData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2 text-xs">
                          <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground capitalize truncate">{d.name}</span>
                          <span className="font-semibold text-foreground ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OPERATIONS TAB */}
          <TabsContent value="operations" className="space-y-6 outline-none">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[summaryCards[0], summaryCards[5], summaryCards[3], summaryCards[7]].map((stat, i) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{stat.title}</CardTitle>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                      {(stat as any).sub && <p className="text-[11px] text-muted-foreground mt-0.5">{(stat as any).sub}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Priority Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {(["critical", "high", "medium", "low"] as const).map(p => {
                      const count = stats?.priorityCounts[p] || 0;
                      const total = stats?.totalTickets || 1;
                      const pct = Math.round((count / total) * 100) || 0;
                      const colors: Record<string, string> = {
                        critical: "bg-destructive",
                        high: "bg-[hsl(var(--warning))]",
                        medium: "bg-primary",
                        low: "bg-muted-foreground/40",
                      };
                      return (
                        <div key={p}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize text-muted-foreground">{p}</span>
                            <span className="font-semibold text-foreground">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${colors[p]} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Published Articles</span>
                    <Badge variant="outline" className="text-xs">{stats?.publishedArticles ?? 0}/{stats?.totalArticles ?? 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pending Review</span>
                    <Badge variant="outline" className="text-xs">{stats?.underReview ?? 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Submitted</span>
                    <Badge variant="outline" className="text-xs">{stats?.submitted ?? 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Contact Inquiries</span>
                    <Badge variant="outline" className="text-xs">{stats?.totalContacts ?? 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FINANCE TAB */}
          <TabsContent value="finance" className="space-y-6 outline-none">
            <div className="grid grid-cols-2 gap-4 border-b pb-6">
              {[summaryCards[1], summaryCards[2]].map((stat, i) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{stat.title}</CardTitle>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                      {(stat as any).sub && <p className="text-[11px] text-muted-foreground mt-0.5">{(stat as any).sub}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Credits Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total in Circulation</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalCredits ?? 0}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Purchased</p>
                      <p className="text-lg font-bold text-accent">+{stats?.creditsPurchased ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="text-lg font-bold text-destructive">-{stats?.creditsSpent ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Spenders */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Crown className="h-4 w-4 text-accent" />
                    Top Spenders
                  </CardTitle>
                  <CardDescription className="text-xs">By credits spent · {PERIOD_LABELS[period]}</CardDescription>
                </CardHeader>
                <CardContent>
                  {(stats?.topSpenders || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No spending data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats?.topSpenders.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-3">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate flex-1">{s.name}</span>
                          <Badge variant="secondary" className="font-mono text-xs">{s.amount} cr</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-6 outline-none">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b">
              {[summaryCards[6]].map((stat, i) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{stat.title}</CardTitle>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                      {(stat as any).sub && <p className="text-[11px] text-muted-foreground mt-0.5">{(stat as any).sub}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Most Active Users */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Most Active Users
                  </CardTitle>
                  <CardDescription className="text-xs">By tickets submitted · {PERIOD_LABELS[period]}</CardDescription>
                </CardHeader>
                <CardContent>
                  {(stats?.topActive || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No activity data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats?.topActive.map((s, i) => (
                        <div key={s.name} className="flex items-center gap-3">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate flex-1">{s.name}</span>
                          <Badge variant="secondary" className="text-xs">{s.count} tickets</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
