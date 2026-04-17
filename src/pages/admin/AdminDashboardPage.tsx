import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/pages/admin/dashboard/DashboardHeader";
import FinanceTab from "@/pages/admin/dashboard/FinanceTab";
import OperationsTab from "@/pages/admin/dashboard/OperationsTab";
import OverviewTab from "@/pages/admin/dashboard/OverviewTab";
import UsersTab from "@/pages/admin/dashboard/UsersTab";
import { useAdminDashboardPage } from "@/pages/admin/dashboard/useAdminDashboardPage";

export default function AdminDashboardPage() {
  const { period, setPeriod, stats, summaryCards, statusPieData } = useAdminDashboardPage();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader period={period} onPeriodChange={setPeriod} />

        <Tabs defaultValue="overview" className="space-y-6 w-full">
          <TabsList className="h-auto w-full justify-start p-1 bg-muted/40 overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">System Overview</TabsTrigger>
            <TabsTrigger value="operations" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">Operations</TabsTrigger>
            <TabsTrigger value="finance" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">Finance</TabsTrigger>
            <TabsTrigger value="users" className="px-6 py-2.5 text-sm font-medium whitespace-nowrap">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab period={period} stats={stats} summaryCards={summaryCards} statusPieData={statusPieData} />
          </TabsContent>

          <TabsContent value="operations">
            <OperationsTab stats={stats} summaryCards={summaryCards} />
          </TabsContent>

          <TabsContent value="finance">
            <FinanceTab period={period} stats={stats} summaryCards={summaryCards} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab period={period} stats={stats} summaryCards={summaryCards} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
