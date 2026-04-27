import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardMetricCards from "@/pages/admin/dashboard/DashboardMetricCards";
import { PERIOD_LABELS, type Period, type Stats, type SummaryCard } from "@/pages/admin/dashboard/types";

type UsersTabProps = {
  period: Period;
  stats: Stats | null;
  summaryCards: SummaryCard[];
};

export default function UsersTab({ period, stats, summaryCards }: UsersTabProps) {
  return (
    <div className="space-y-6 outline-none">
      <DashboardMetricCards cards={[summaryCards[6]]} className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b" />

      <div className="grid md:grid-cols-2 gap-4">
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
                {stats?.topActive.map((user, i) => (
                  <div key={user.name} className="flex items-center gap-3">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate flex-1">{user.name}</span>
                    <Badge variant="secondary" className="text-xs">{user.count} tickets</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
