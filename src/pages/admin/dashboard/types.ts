import type { LucideIcon } from "lucide-react";

export type Period = "today" | "week" | "month" | "all";

export type Stats = {
  totalTickets: number;
  submitted: number;
  underReview: number;
  inProgress: number;
  completed: number;
  totalUsers: number;
  totalCredits: number;
  totalArticles: number;
  publishedArticles: number;
  creditsSpent: number;
  creditsPurchased: number;
  totalHours: number;
  topSpenders: Array<{ name: string; amount: number }>;
  topActive: Array<{ name: string; count: number }>;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  ticketTrend: { label: string; count: number }[];
  unreadContacts: number;
  totalContacts: number;
};

export type SummaryCard = {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  sub?: string;
};

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(40, 90%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(180, 50%, 45%)",
];
