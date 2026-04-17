import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryCard } from "@/pages/admin/dashboard/types";

type DashboardMetricCardsProps = {
  cards: SummaryCard[];
  className?: string;
};

export default function DashboardMetricCards({ cards, className }: DashboardMetricCardsProps) {
  return (
    <div className={className || "grid grid-cols-2 lg:grid-cols-4 gap-4"}>
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.04 }}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{card.title}</CardTitle>
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{card.value}</div>
              {card.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
