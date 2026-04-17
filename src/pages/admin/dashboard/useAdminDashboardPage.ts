import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays, subMonths, isAfter, format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { Ticket, Users, Coins, TrendingUp, Clock, CheckCircle, DollarSign, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type Period, type Stats, type SummaryCard } from "@/pages/admin/dashboard/types";

type ContactRow = {
  id: string;
  created_at: string;
  is_read: boolean | null;
};

function getStartDate(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "today":
      return startOfDay(now);
    case "week":
      return startOfWeek(now, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(now);
    case "all":
      return null;
  }
}

export function useAdminDashboardPage() {
  const [period, setPeriod] = useState<Period>("month");

  const { data: rawData } = useQuery({
    queryKey: ["admin-dashboard-data"],
    queryFn: async () => {
      const [ticketsRes, profilesRes, articlesRes, transactionsRes, contactsRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("id, status, credit_cost, estimated_hours, created_at, user_id, priority, difficulty_level"),
        supabase.from("profiles").select("id, user_id, full_name, email, credits"),
        supabase.from("articles").select("id, published"),
        supabase.from("credit_transactions").select("id, user_id, amount, type, created_at"),
        supabase.from("contact_submissions" as never).select("id, created_at, is_read"),
      ]);

      return {
        tickets: ticketsRes.data || [],
        profiles: profilesRes.data || [],
        articles: articlesRes.data || [],
        transactions: transactionsRes.data || [],
        contacts: (contactsRes.data || []) as ContactRow[],
      };
    },
  });

  const stats = useMemo<Stats | null>(() => {
    if (!rawData) return null;

    const { tickets, profiles, articles, transactions, contacts } = rawData;
    const start = getStartDate(period);

    const filteredTickets = start ? tickets.filter((ticket) => isAfter(new Date(ticket.created_at), start)) : tickets;
    const filteredTx = start ? transactions.filter((tx) => isAfter(new Date(tx.created_at), start)) : transactions;
    const filteredContacts = start ? contacts.filter((contact) => isAfter(new Date(contact.created_at), start)) : contacts;

    const statusCounts: Record<string, number> = {};
    filteredTickets.forEach((ticket) => {
      statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
    });

    const priorityCounts: Record<string, number> = {};
    filteredTickets.forEach((ticket) => {
      priorityCounts[ticket.priority] = (priorityCounts[ticket.priority] || 0) + 1;
    });

    const creditsSpent = filteredTx
      .filter((tx) => tx.type === "deduction")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const creditsPurchased = filteredTx
      .filter((tx) => tx.type === "purchase")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const spendByUser: Record<string, number> = {};
    filteredTx
      .filter((tx) => tx.type === "deduction")
      .forEach((tx) => {
        spendByUser[tx.user_id] = (spendByUser[tx.user_id] || 0) + Math.abs(tx.amount);
      });

    const topSpenders = Object.entries(spendByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, amount]) => {
        const profile = profiles.find((p) => p.user_id === userId);
        return {
          name: profile?.full_name || profile?.email || "Unknown",
          amount,
        };
      });

    const ticketsByUser: Record<string, number> = {};
    filteredTickets.forEach((ticket) => {
      ticketsByUser[ticket.user_id] = (ticketsByUser[ticket.user_id] || 0) + 1;
    });

    const topActive = Object.entries(ticketsByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => {
        const profile = profiles.find((p) => p.user_id === userId);
        return {
          name: profile?.full_name || profile?.email || "Unknown",
          count,
        };
      });

    const totalHours = filteredTickets.reduce((sum, ticket) => sum + (ticket.estimated_hours || 0), 0);

    const ticketTrend: { label: string; count: number }[] = [];
    if (period === "today" || period === "week") {
      const days = period === "today" ? 1 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "yyyy-MM-dd");
        const count = tickets.filter((ticket) => format(new Date(ticket.created_at), "yyyy-MM-dd") === dayStr).length;
        ticketTrend.push({ label: format(day, "EEE"), count });
      }
    } else if (period === "month") {
      for (let i = 29; i >= 0; i -= 5) {
        const day = subDays(new Date(), i);
        const dayStr = format(day, "MMM d");
        const rangeStart = subDays(new Date(), i);
        const rangeEnd = subDays(new Date(), Math.max(i - 5, 0));
        const count = tickets.filter((ticket) => {
          const createdAt = new Date(ticket.created_at);
          return createdAt >= rangeStart && createdAt <= rangeEnd;
        }).length;
        ticketTrend.push({ label: dayStr, count });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const monthStr = format(month, "yyyy-MM");
        const count = tickets.filter((ticket) => format(new Date(ticket.created_at), "yyyy-MM") === monthStr).length;
        ticketTrend.push({ label: format(month, "MMM"), count });
      }
    }

    return {
      totalTickets: filteredTickets.length,
      submitted: statusCounts.submitted || 0,
      underReview: statusCounts.under_review || 0,
      inProgress: statusCounts.in_progress || 0,
      completed: statusCounts.completed || 0,
      totalUsers: profiles.length,
      totalCredits: profiles.reduce((sum, profile) => sum + (profile.credits || 0), 0),
      totalArticles: articles.length,
      publishedArticles: articles.filter((article) => article.published).length,
      creditsSpent,
      creditsPurchased,
      totalHours,
      topSpenders,
      topActive,
      statusCounts,
      priorityCounts,
      ticketTrend,
      unreadContacts: filteredContacts.filter((contact) => !contact.is_read).length,
      totalContacts: filteredContacts.length,
    };
  }, [rawData, period]);

  const summaryCards = useMemo<SummaryCard[]>(
    () => [
      {
        title: "Tickets",
        value: stats?.totalTickets ?? 0,
        icon: Ticket,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Credits Spent",
        value: stats?.creditsSpent ?? 0,
        icon: DollarSign,
        color: "text-destructive",
        bg: "bg-destructive/10",
      },
      {
        title: "Credits Purchased",
        value: stats?.creditsPurchased ?? 0,
        icon: Coins,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        title: "Est. Hours",
        value: stats?.totalHours ?? 0,
        icon: Clock,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Completed",
        value: stats?.completed ?? 0,
        icon: CheckCircle,
        color: "text-[hsl(var(--success))]",
        bg: "bg-[hsl(var(--success))]/10",
      },
      {
        title: "In Progress",
        value: stats?.inProgress ?? 0,
        icon: TrendingUp,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        title: "Users",
        value: stats?.totalUsers ?? 0,
        icon: Users,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Contact Inquiries",
        value: stats?.totalContacts ?? 0,
        sub: stats?.unreadContacts ? `${stats.unreadContacts} unread` : undefined,
        icon: MessageSquare,
        color: "text-[hsl(var(--info))]",
        bg: "bg-[hsl(var(--info))]/10",
      },
    ],
    [stats]
  );

  const statusPieData = useMemo(
    () => (stats ? Object.entries(stats.statusCounts).map(([name, value]) => ({ name: name.replace("_", " "), value })) : []),
    [stats]
  );

  const priorityPieData = useMemo(
    () => (stats ? Object.entries(stats.priorityCounts).map(([name, value]) => ({ name, value })) : []),
    [stats]
  );

  return {
    period,
    setPeriod,
    stats,
    summaryCards,
    statusPieData,
    priorityPieData,
  };
}
