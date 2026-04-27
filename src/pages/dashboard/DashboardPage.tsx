import { Navigate, useLocation, useNavigate } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useUserRole } from "@/hooks/useUserRole";
import TicketSubmissionWidget from "@/components/widgets/TicketSubmissionWidget";
import TicketDashboardWidget from "@/components/widgets/TicketDashboardWidget";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { GuestBanner } from "./components/GuestBanner";
import { SectionHeader } from "./components/SectionHeader";
import { useProfileCompanySlug } from "./hooks/useDashboardQueries";
import { stagger } from "./constants";

export default function DashboardPage() {
  const { profile, isGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAgent, activeCompany, activeMembership, isLoading: tenantLoading, visibilityMap } = useAgentTenant();
  const { role, isLoading: roleLoading } = useUserRole();

  const hasCompanyDashboardMembership =
    activeMembership?.role === "owner" || activeMembership?.role === "admin";

  const { data: profileCompanySlug, isLoading: profileCompanyLoading } = useProfileCompanySlug(
    profile?.user_id,
    role === "member" || role === "company_admin"
  );

  const isLoadingData = roleLoading || profileCompanyLoading;
  const shouldSkipRedirect = location.search.includes("redirect=false");

  if (isLoadingData) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </div>
      </ProtectedLayout>
    );
  }

  let redirectTarget: string | null = null;

  if (!shouldSkipRedirect && !isGuest && !tenantLoading) {
    if (role === "admin") {
      redirectTarget = "/admin";
    } else if (role === "consultant") {
      redirectTarget = "/consultant/dashboard";
    } else if (isAgent && role === "agent") {
      redirectTarget = "/agent/dashboard";
    } else if (role === "company_admin" && activeCompany?.slug) {
      redirectTarget = `/${activeCompany.slug}/dashboard`;
    } else if (role === "member") {
      if (activeCompany?.slug) {
        redirectTarget = `/${activeCompany.slug}/dashboard`;
      } else if (profileCompanySlug) {
        redirectTarget = `/${profileCompanySlug}/dashboard`;
      }
    } else if (hasCompanyDashboardMembership && activeCompany?.slug) {
      redirectTarget = `/${activeCompany.slug}/dashboard`;
    }
  }

  if (redirectTarget) {
    return <Navigate to={redirectTarget} replace />;
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
        <div className="space-y-1">
          <motion.h1
            {...stagger.item}
            className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight"
          >
            {isGuest ? "Welcome, Guest 👋" : `Welcome back, ${profile?.full_name?.split(" ")[0] || "there"} 👋`}
          </motion.h1>
          <motion.p {...stagger.item} className="text-sm sm:text-base text-muted-foreground">
            {isGuest
              ? "Explore Customer Connect and sign up for full access."
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

        {isGuest && <GuestBanner />}

        {!isGuest && isAgent && !activeCompany && (
          <motion.div {...stagger.item} className="rounded-ds-xl border border-warning/30 bg-warning/10 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-foreground">Complete Agent Onboarding</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Create your company account to start managing companies and members.
            </p>
            <Button className="mt-4 h-11 rounded-ds-md" onClick={() => navigate("/agent/dashboard")}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {!isGuest && !isAgent && (canShow("ticket_submission") || canShow("ticket_overview")) && (
          <div className="space-y-4">
            <SectionHeader title="Your Tickets" subtitle="Submit requests and track progress" />
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
