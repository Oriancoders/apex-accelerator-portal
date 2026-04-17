import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERIOD_LABELS, type Period } from "@/pages/admin/dashboard/types";

type DashboardHeaderProps = {
  period: Period;
  onPeriodChange: (period: Period) => void;
};

export default function DashboardHeader({ period, onPeriodChange }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Analytics & insights for the portal</p>
      </motion.div>

      <Tabs value={period} onValueChange={(value) => onPeriodChange(value as Period)} className="w-fit">
        <TabsList className="h-auto p-1 border shadow-sm">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
            <TabsTrigger key={key} value={key} className="px-6 py-2.5 text-sm font-medium transition-colors">
              {PERIOD_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
