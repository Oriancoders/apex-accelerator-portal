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
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/*
 * HCI Principles Applied:
 *
 * CHUNKING (Miller's Law — 7±2): Dashboard organized into 3 visual sections:
 *   1. Hero greeting (context & orientation)
 *   2. Quick actions / ticket area (primary task)
 *   3. Resource grid (exploration)
 *   Each section contains ≤4 items to stay within cognitive limits.
 *
 * HICK'S LAW: Reduced decision complexity:
 *   - Guest sees 2 sections (explore + resources), no ticket clutter
 *   - Authenticated sees 3 sections with clear visual hierarchy
 *   - Primary CTA is always visually dominant
 *
 * FITTS'S LAW: Primary actions are large, full-width on mobile.
 *   Widget cards have generous padding for easy touch targets.
 *
 * MEMORY THEORY (Recognition > Recall):
 *   - Icons paired with every label — visual recognition
 *   - Status colors consistent (primary=info, accent=active, success=done)
 *   - Section headers provide clear context cues
 *
 * GESTALT: Common Region (cards), Proximity (grouped sections),
 *   Similarity (consistent card styling), Continuity (grid flow)
 *
 * RESPONSIVE: Mobile-first grid with breakpoints at sm/md/lg/xl.
 *   Single column mobile → 2 col tablet → 3 col desktop.
 */

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.06 } },
  },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  },
};

function GuestBanner() {
  const navigate = useNavigate();
  return (
    <motion.div
      {...stagger.item}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5 p-5 sm:p-8"
    >
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Get Full Access</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Sign up to submit service requests, track tickets, chat with experts, and earn 50 free credits.
          </p>
        </div>
        {/* Fitts's Law: Large CTA */}
        <Button
          size="lg"
          className="w-full sm:w-auto gap-2 h-12 rounded-xl font-semibold shadow-[var(--shadow-primary)] flex-shrink-0"
          onClick={() => navigate("/auth")}
        >
          Sign Up Free
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div {...stagger.item} className="space-y-0.5">
      <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { profile, isGuest } = useAuth();

  return (
    <ProtectedLayout>
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="space-y-6 sm:space-y-8"
      >
        {/* ── Section 1: Hero Greeting (Chunking — orientation) ────────── */}
        <div className="space-y-1">
          <motion.h1
            {...stagger.item}
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight"
          >
            {isGuest ? "Welcome, Guest 👋" : `Welcome back, ${profile?.full_name?.split(" ")[0] || "there"} 👋`}
          </motion.h1>
          <motion.p {...stagger.item} className="text-sm sm:text-base text-muted-foreground">
            {isGuest
              ? "Explore our Salesforce services hub — sign up for full access."
              : "Your Salesforce services hub — submit requests, track progress, and explore resources."}
          </motion.p>
        </div>

        {/* ── Guest CTA Banner ─────────────────────────────────────────── */}
        {isGuest && <GuestBanner />}

        {/* ── Section 2: Ticket Area (Authenticated only — Primary task) ─ */}
        {!isGuest && (
          <div className="space-y-4">
            <SectionHeader title="Your Tickets" subtitle="Submit requests and track progress" />
            {/* Responsive: 1 col mobile → 2 col tablet+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <motion.div {...stagger.item}>
                <TicketSubmissionWidget />
              </motion.div>
              <motion.div {...stagger.item}>
                <TicketDashboardWidget />
              </motion.div>
            </div>
          </div>
        )}

        {/* ── Section 3: Resources Grid (Chunking — ≤4 items per row) ── */}
        <div className="space-y-4">
          <SectionHeader
            title="Resources & Tools"
            subtitle="Explore guides, apps, and productivity tools"
          />
          {/* Responsive grid: 1 col mobile → 2 col tablet → 3 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            <motion.div {...stagger.item}>
              <AiAssistantWidget />
            </motion.div>
            <motion.div {...stagger.item}>
              <KnowledgeBaseWidget />
            </motion.div>
            <motion.div {...stagger.item}>
              <RecipesWidget />
            </motion.div>
            <motion.div {...stagger.item}>
              <AppExchangeWidget />
            </motion.div>
            <motion.div {...stagger.item}>
              <NewsWidget />
            </motion.div>
            <motion.div {...stagger.item}>
              <ExtensionsWidget />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </ProtectedLayout>
  );
}
