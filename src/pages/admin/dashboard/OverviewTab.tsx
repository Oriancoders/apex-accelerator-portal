import { Activity, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardMetricCards from "@/pages/admin/dashboard/DashboardMetricCards";
import { CHART_COLORS, PERIOD_LABELS, type Period, type Stats, type SummaryCard } from "@/pages/admin/dashboard/types";

type OverviewTabProps = {
  period: Period;
  stats: Stats | null;
  summaryCards: SummaryCard[];
  statusPieData: Array<{ name: string; value: number }>;
};

export default function OverviewTab({ period, stats, summaryCards, statusPieData }: OverviewTabProps) {
  return (
    <div className="space-y-6 outline-none">
      <DashboardMetricCards cards={[summaryCards[0], summaryCards[4], summaryCards[6], summaryCards[1]]} />

      <div className="grid md:grid-cols-2 gap-4">
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
                {statusPieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-muted-foreground capitalize truncate">{item.name}</span>
                    <span className="font-semibold text-foreground ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
