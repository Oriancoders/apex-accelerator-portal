import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import TicketSubmissionWidget from "@/components/widgets/TicketSubmissionWidget";
import TicketDashboardWidget from "@/components/widgets/TicketDashboardWidget";
import { Button } from "@/components/ui/button";
import { Settings, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.06 } },
  },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  },
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div {...stagger.item} className="space-y-0.5">
      <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

export default function CompanyDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 1. Fetch Company by Slug
  const { data: company, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ["company-by-slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, status")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    retry: false
  });

  // 2. Check Membership
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["my-membership", company?.id, user?.id],
    queryFn: async () => {
      if (!company?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from("company_memberships")
        .select("role")
        .eq("company_id", company.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data; // returns { role: ... } or null
    },
    enabled: !!company?.id && !!user?.id
  });

  // 3. Fetch Visibility Settings
  const { data: visibilitySettings = [] } = useQuery({
    queryKey: ["company-visibility", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from("company_component_visibility")
        .select("component_key, is_enabled")
        .eq("company_id", company.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id
  });

  // 4. Fetch Assigned Agent (if any)
  const { data: assignedAgentRaw } = useQuery({
    queryKey: ["company-agent", company?.id],
    queryFn: async () => {
      if (!company?.id) return null;
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select(`
          agents (
            display_name,
            email
          )
        `)
        .eq("company_id", company.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error fetching agent:", error);
        return null;
      }
      return data;
    },
    enabled: !!company?.id,
  });

  // @ts-ignore - Supabase type inference for nested joins can be tricky
  const assignedAgent = assignedAgentRaw?.agents as { display_name: string | null; email: string | null } | null | undefined;

  const visibilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    // Default all to true if not set, or false?
    // Usually features are enabled by default unless explicitly disabled.
    // However, if the row exists, use is_enabled. If not, maybe default true?
    // Let's assume default true for now, consistent with useAgentTenant hook likely logic.
    // Actually, distinct logic: if row exists, follow it. If not, default true.
    visibilitySettings.forEach((row) => {
      map[row.component_key] = row.is_enabled;
    });
    return map;
  }, [visibilitySettings]);

  // Helper to check visibility (default true)
  const isVisible = (key: string) => visibilityMap[key] !== false;

  // Loading States
  if (companyLoading || membershipLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </div>
      </ProtectedLayout>
    );
  }

  // Error / Not Found / No Access
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
        {/* Header */}
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
          {/* 1. Ticket Submission & Overview */}
          {(isVisible("ticket_submission") || isVisible("ticket_overview")) && (
            <section className="space-y-4">
              <SectionHeader title="Service Requests" subtitle="Submit and track your requests" />
              <div className="grid gap-4 lg:grid-cols-3">
                {isVisible("ticket_submission") && (
                  <div className="lg:col-span-1">
                    <TicketSubmissionWidget />
                  </div>
                )}
                {isVisible("ticket_overview") && (
                  <div className={isVisible("ticket_submission") ? "lg:col-span-2" : "lg:col-span-3"}>
                    <TicketDashboardWidget
                      companyId={company.id}
                      showCompanyWide={canManage}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

        </motion.div>
      </div>
    </ProtectedLayout>
  );
}
