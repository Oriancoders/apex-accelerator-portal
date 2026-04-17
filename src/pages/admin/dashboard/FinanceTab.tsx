import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardMetricCards from "@/pages/admin/dashboard/DashboardMetricCards";
import { PERIOD_LABELS, type Period, type Stats, type SummaryCard } from "@/pages/admin/dashboard/types";

type FinanceTabProps = {
  period: Period;
  stats: Stats | null;
  summaryCards: SummaryCard[];
};

export default function FinanceTab({ period, stats, summaryCards }: FinanceTabProps) {
  return (
    <div className="space-y-6 outline-none">
      <DashboardMetricCards cards={[summaryCards[1], summaryCards[2]]} className="grid grid-cols-2 gap-4 border-b pb-6" />

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
                {stats?.topSpenders.map((spender, i) => (
                  <div key={spender.name} className="flex items-center gap-3">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-foreground truncate flex-1">{spender.name}</span>
                    <Badge variant="secondary" className="font-mono text-xs">{spender.amount} cr</Badge>
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
