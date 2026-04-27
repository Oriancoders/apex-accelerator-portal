import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import TicketSubmissionWidget from "@/components/widgets/TicketSubmissionWidget";
import TicketDashboardWidget from "@/components/widgets/TicketDashboardWidget";
import { Button } from "@/components/ui/button";
import { Settings, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useCompanyBySlug, useCompanyMembership, useAssignedAgent, useCompanyActiveSubscription } from "./hooks/useCompanyQueries";
import { SectionHeader } from "./components/SectionHeader";
import { SubscriptionStatusCard } from "./components/SubscriptionStatusCard";
import { stagger } from "./constants";

export default function CompanyDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: company, isLoading: companyLoading, error: companyError } = useCompanyBySlug(slug);
  const { data: membership, isLoading: membershipLoading } = useCompanyMembership(company?.id, user?.id);
  const { data: assignedAgentRaw } = useAssignedAgent(company?.id);
  const { data: activeSubscription = null } = useCompanyActiveSubscription(company?.id);

  const assignedAgent = (assignedAgentRaw?.agents as { display_name: string | null; email: string | null } | null) || null;
  const isVisible = () => true;

  if (companyLoading || membershipLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </div>
      </ProtectedLayout>
    );
  }

  if (companyError || !company) {
    return (
      <ProtectedLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <h2 className="text-xl font-bold">Company Not Found</h2>
          <p className="text-muted-foreground">The company "{slug}" does not exist.</p>
          <Button onClick={() => navigate("/dashboard")}>Go Home</Button>
        </div>
      </ProtectedLayout>
    );
  }

  if (!membership) {
    return (
      <ProtectedLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You are not a member of {company.name}.</p>
          <Button onClick={() => navigate("/dashboard")}>Go Home</Button>
        </div>
      </ProtectedLayout>
    );
  }

  const canManage = membership.role === "owner" || membership.role === "admin";

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {company.name} Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.email}
              </p>
              {assignedAgent && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <UserCheck className="w-3 h-3" />
                  <span>Agent: {assignedAgent.display_name || assignedAgent.email}</span>
                </div>
              )}
            </div>
          </div>
          {canManage && (
            <Button variant="outline" onClick={() => navigate(`/${slug}/settings`)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
        </div>

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          <section className="space-y-4">
            <SectionHeader title="Subscription" subtitle="Company plan and ticket coverage" />
            <SubscriptionStatusCard subscription={activeSubscription} />
          </section>

          {(isVisible() || isVisible()) && (
            <section className="space-y-4">
              <SectionHeader title="Service Requests" subtitle="Submit and track your requests" />
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <TicketSubmissionWidget />
                </div>
                <div className="lg:col-span-2">
                  <TicketDashboardWidget
                    companyId={company.id}
                    showCompanyWide={canManage}
                  />
                </div>
              </div>
            </section>
          )}
        </motion.div>
      </div>
    </ProtectedLayout>
  );
}
