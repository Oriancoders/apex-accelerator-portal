import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardMetricCards from "@/pages/admin/dashboard/DashboardMetricCards";
import type { Stats, SummaryCard } from "@/pages/admin/dashboard/types";

type OperationsTabProps = {
  stats: Stats | null;
  summaryCards: SummaryCard[];
};

export default function OperationsTab({ stats, summaryCards }: OperationsTabProps) {
  return (
    <div className="space-y-6 outline-none">
      <DashboardMetricCards cards={[summaryCards[0], summaryCards[5], summaryCards[3], summaryCards[7]]} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {(["critical", "high", "medium", "low"] as const).map((priority) => {
                const count = stats?.priorityCounts[priority] || 0;
                const total = stats?.totalTickets || 1;
                const percent = Math.round((count / total) * 100) || 0;
                const colors: Record<string, string> = {
                  critical: "bg-destructive",
                  high: "bg-[hsl(var(--warning))]",
                  medium: "bg-primary",
                  low: "bg-muted-foreground/40",
                };

                return (
                  <div key={priority}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-muted-foreground">{priority}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[priority]} transition-all`}
                        style={{ width: `${percent}%` }}
                      />
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
              <Badge variant="outline" className="text-xs">
                {stats?.publishedArticles ?? 0}/{stats?.totalArticles ?? 0}
              </Badge>
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
    </div>
  );
}
