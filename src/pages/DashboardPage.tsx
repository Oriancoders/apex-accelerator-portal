import ProtectedLayout from "@/components/ProtectedLayout";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

import TicketSubmissionWidget from "@/components/widgets/TicketSubmissionWidget";
import TicketDashboardWidget from "@/components/widgets/TicketDashboardWidget";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

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
            Sign up to submit tasks, track ticket progress, chat with experts, and start with 50 free credits.
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
  const navigate = useNavigate();
  const location = useLocation();
  const { isAgent, activeCompany, activeMembership, isLoading: tenantLoading, visibilityMap } = useAgentTenant();
  const { role, isLoading: roleLoading } = useUserRole();

  const hasCompanyDashboardMembership =
    activeMembership?.role === "owner" || activeMembership?.role === "admin";

  const { data: profileCompanySlug, isLoading: profileCompanyLoading } = useQuery({
    queryKey: ["profile-company-slug", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;

      // @ts-ignore - company_id exists in DB, generated types may lag
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        // @ts-ignore
        .select("company_id")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (profileError) return null;
      // @ts-ignore
      const companyId = profileRow?.company_id as string | undefined;
      if (!companyId) return null;

      const { data: companyRow, error: companyError } = await supabase
        .from("companies")
        .select("slug")
        .eq("id", companyId)
        .maybeSingle();

      if (companyError) return null;
      return companyRow?.slug || null;
    },
    enabled: !!profile?.user_id && (role === "member" || role === "company_admin") && !activeCompany?.slug,
    staleTime: 60_000,
  });

  if (roleLoading || profileCompanyLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </div>
      </ProtectedLayout>
    );
  }

  // Redirect to company dashboard if logged in and has primary company
  if (!isGuest && !tenantLoading && activeCompany?.slug && !location.search.includes("redirect=false")) {
    if (role === "admin") return <Navigate to="/admin" replace />;

    // Agent dashboard is only valid for users with an active agent profile.
    if (isAgent) return <Navigate to="/agent/dashboard" replace />;

    if (role === "company_admin") {
      return <Navigate to={`/${activeCompany.slug}/dashboard`} replace />;
    }

    if (role === "member") {
      return <Navigate to={`/${activeCompany.slug}/dashboard`} replace />;
    }

    // Legacy company membership support.
    if (hasCompanyDashboardMembership) return <Navigate to={`/${activeCompany.slug}/dashboard`} replace />;
  }

  if (!isGuest && !tenantLoading && role === "admin" && !location.search.includes("redirect=false")) {
    return <Navigate to="/admin" replace />;
  }

  if (!isGuest && !tenantLoading && isAgent && !location.search.includes("redirect=false")) {
    return <Navigate to="/agent/dashboard" replace />;
  }

  if (!isGuest && !tenantLoading && !location.search.includes("redirect=false")) {
    if ((role === "member" || role === "company_admin") && profileCompanySlug) {
      return <Navigate to={`/${profileCompanySlug}/dashboard`} replace />;
    }
  }

  const canShow = (componentKey: string) => {
    if (!activeCompany) return true;
    if (visibilityMap[componentKey] === undefined) return true;
    return visibilityMap[componentKey];
  };

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
              ? "Explore CustomerPortol and sign up for full access."
              : isAgent
                ? "Your agent workspace — manage your company experience and tailored modules."
                : "Your workspace to submit tasks, approve proposals, and track delivery."}
          </motion.p>
        </div>

        {!isGuest && activeCompany && (
          <motion.div {...stagger.item} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Active Company: {activeCompany.name}
          </motion.div>
        )}

        {/* ── Guest CTA Banner ─────────────────────────────────────────── */}
        {isGuest && <GuestBanner />}

        {/* ── Agent onboarding CTA ─────────────────────────────────────── */}
        {!isGuest && isAgent && !activeCompany && (
          <motion.div {...stagger.item} className="rounded-2xl border border-warning/30 bg-warning/10 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-foreground">Complete Agent Onboarding</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Create your company account to enable tenant-specific dashboard modules and component visibility controls.
            </p>
            <Button className="mt-4 h-11 rounded-xl" onClick={() => navigate("/agent/dashboard")}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ── Section 2: Ticket Area (Authenticated only — Primary task) ─ */}
        {!isGuest && !isAgent && (canShow("ticket_submission") || canShow("ticket_overview")) && (
          <div className="space-y-4">
            <SectionHeader title="Your Tickets" subtitle="Submit requests and track progress" />
            {/* Responsive: 1 col mobile → 2 col tablet+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {canShow("ticket_submission") && (
                <motion.div {...stagger.item}>
                  <TicketSubmissionWidget />
                </motion.div>
              )}
              {canShow("ticket_overview") && (
                <motion.div {...stagger.item}>
                  <TicketDashboardWidget />
                </motion.div>
              )}
            </div>
          </div>
        )}

      </motion.div>
      <Footer />
    </ProtectedLayout>
  );
}
