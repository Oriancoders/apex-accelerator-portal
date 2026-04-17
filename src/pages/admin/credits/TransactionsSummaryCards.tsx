import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryCard } from "@/pages/admin/credits/types";

type TransactionsSummaryCardsProps = {
  cards: SummaryCard[];
};

export default function TransactionsSummaryCards({ cards }: TransactionsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 sm:px-6 sm:pt-5">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
              <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${card.color}`}>{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
