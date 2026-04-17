import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WithdrawalsStatsCardsProps = {
  totalRequests: number;
  pendingCount: number;
  totalRequested: number;
};

export default function WithdrawalsStatsCards({
  totalRequests,
  pendingCount,
  totalRequested,
}: WithdrawalsStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="text-2xl font-bold text-primary">{totalRequests}</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending / Approved</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="text-2xl font-bold text-warning">{pendingCount}</div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Credits Requested</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="text-2xl font-bold text-foreground">{totalRequested}</div>
        </CardContent>
      </Card>
    </div>
  );
}
