import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/contexts/AuthContext";
import AppExchangeWidget from "@/components/widgets/AppExchangeWidget";
import NewsWidget from "@/components/widgets/NewsWidget";
import KnowledgeBaseWidget from "@/components/widgets/KnowledgeBaseWidget";
import RecipesWidget from "@/components/widgets/RecipesWidget";
import ExtensionsWidget from "@/components/widgets/ExtensionsWidget";
import AiAssistantWidget from "@/components/widgets/AiAssistantWidget";
import TicketSubmissionWidget from "@/components/widgets/TicketSubmissionWidget";
import TicketDashboardWidget from "@/components/widgets/TicketDashboardWidget";
import { motion } from "framer-motion";

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

export default function DashboardPage() {
  const { profile } = useAuth();

  return (
    <ProtectedLayout>
      <div className="mb-6">
        <motion.h1 {...fadeIn(0)} className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
        </motion.h1>
        <motion.p {...fadeIn(0.05)} className="text-muted-foreground mt-1">
          Your Salesforce services hub — submit requests, track progress, and explore resources.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Center column - Ticket Submission (PRIMARY) */}
        <motion.div {...fadeIn(0.1)} className="lg:col-span-1 lg:row-span-2 order-first lg:order-none lg:col-start-2">
          <TicketSubmissionWidget />
          <div className="mt-5">
            <TicketDashboardWidget />
          </div>
        </motion.div>

        {/* Left column */}
        <div className="space-y-5 lg:col-start-1 lg:row-start-1">
          <motion.div {...fadeIn(0.15)}>
            <AppExchangeWidget />
          </motion.div>
          <motion.div {...fadeIn(0.2)}>
            <NewsWidget />
          </motion.div>
          <motion.div {...fadeIn(0.25)}>
            <KnowledgeBaseWidget />
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-start-3 lg:row-start-1">
          <motion.div {...fadeIn(0.15)}>
            <AiAssistantWidget />
          </motion.div>
          <motion.div {...fadeIn(0.2)}>
            <RecipesWidget />
          </motion.div>
          <motion.div {...fadeIn(0.25)}>
            <ExtensionsWidget />
          </motion.div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
