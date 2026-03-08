import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Users, Coins, FileText, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";

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

      const submitted = tickets.filter((t) => t.status === "submitted").length;
      const inProgress = tickets.filter((t) => t.status === "in_progress").length;
      const completed = tickets.filter((t) => t.status === "completed").length;
      const underReview = tickets.filter((t) => t.status === "under_review").length;
      const totalRevenue = tickets.reduce((sum, t) => sum + (t.credit_cost || 0), 0);

      return {
        totalTickets: tickets.length,
        submitted,
        underReview,
        inProgress,
        completed,
        totalUsers: profiles.length,
        totalCreditsInCirculation: profiles.reduce((sum, p) => sum + (p.credits || 0), 0),
        totalArticles: articles.length,
        publishedArticles: articles.filter((a) => a.published).length,
        totalRevenue,
      };
    },
  });

  const statCards = [
    { title: "Total Tickets", value: stats?.totalTickets ?? 0, icon: Ticket, color: "text-primary" },
    { title: "Submitted", value: stats?.submitted ?? 0, icon: AlertTriangle, color: "text-warning" },
    { title: "Under Review", value: stats?.underReview ?? 0, icon: Clock, color: "text-info" },
    { title: "In Progress", value: stats?.inProgress ?? 0, icon: TrendingUp, color: "text-accent" },
    { title: "Completed", value: stats?.completed ?? 0, icon: CheckCircle, color: "text-success" },
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { title: "Credits in Circulation", value: stats?.totalCreditsInCirculation ?? 0, icon: Coins, color: "text-accent" },
    { title: "Published Articles", value: `${stats?.publishedArticles ?? 0}/${stats?.totalArticles ?? 0}`, icon: FileText, color: "text-info" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of the Salesforce Services Portal</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
