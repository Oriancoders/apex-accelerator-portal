import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Users, Coins, FileText, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

/*
 * HCI: Chunking — stats grouped into 2 rows of 4 (within 7±2).
 * Fitts's Law: Cards are large touch targets with generous padding.
 * Memory: Icon + color coding for instant recognition.
 * Responsive: 1 col mobile → 2 col tablet → 4 col desktop.
 */

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [ticketsRes, profilesRes, articlesRes] = await Promise.all([
        supabase.from("tickets").select("id, status, credit_cost, created_at"),
        supabase.from("profiles").select("id, credits"),
        supabase.from("articles").select("id, published"),
      ]);

      const tickets = ticketsRes.data || [];
      const profiles = profilesRes.data || [];
      const articles = articlesRes.data || [];

      return {
        totalTickets: tickets.length,
        submitted: tickets.filter((t) => t.status === "submitted").length,
        underReview: tickets.filter((t) => t.status === "under_review").length,
        inProgress: tickets.filter((t) => t.status === "in_progress").length,
        completed: tickets.filter((t) => t.status === "completed").length,
        totalUsers: profiles.length,
        totalCreditsInCirculation: profiles.reduce((sum, p) => sum + (p.credits || 0), 0),
        totalArticles: articles.length,
        publishedArticles: articles.filter((a) => a.published).length,
        totalRevenue: tickets.reduce((sum, t) => sum + (t.credit_cost || 0), 0),
      };
    },
  });

  const statCards = [
    { title: "Total Tickets", value: stats?.totalTickets ?? 0, icon: Ticket, color: "text-primary", bg: "bg-primary/5" },
    { title: "Submitted", value: stats?.submitted ?? 0, icon: AlertTriangle, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))]/5" },
    { title: "Under Review", value: stats?.underReview ?? 0, icon: Clock, color: "text-[hsl(var(--info))]", bg: "bg-[hsl(var(--info))]/5" },
    { title: "In Progress", value: stats?.inProgress ?? 0, icon: TrendingUp, color: "text-accent", bg: "bg-accent/5" },
    { title: "Completed", value: stats?.completed ?? 0, icon: CheckCircle, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary", bg: "bg-primary/5" },
    { title: "Credits in Circulation", value: stats?.totalCreditsInCirculation ?? 0, icon: Coins, color: "text-accent", bg: "bg-accent/5" },
    { title: "Published Articles", value: `${stats?.publishedArticles ?? 0}/${stats?.totalArticles ?? 0}`, icon: FileText, color: "text-[hsl(var(--info))]", bg: "bg-[hsl(var(--info))]/5" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div {...fadeIn}>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of the Salesforce Services Portal</p>
        </motion.div>

        {/* Chunking: 4-per-row grid stays within cognitive limits */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{stat.title}</CardTitle>
                  <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
