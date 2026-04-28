import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import CompanyFormDialog from "@/components/admin/CompanyFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { getInviteResultMessage, inviteCompanyMember } from "@/lib/invite-member";
import type { CompanySubscription } from "@/lib/subscriptions";
import { toast } from "sonner";
import { getUserFacingError } from "@/lib/errors";
import { sanitizeTicketHtml } from "@/lib/sanitize";
import {
  PERIODS,
  TICKET_OPEN_STATUSES,
  TICKET_RESOLVED_STATUSES
} from "./constants";
import { TICKET_PAGE_SIZE } from "@/constants/ticket";
import {
  daysAgo,
  fmtCredits,
  resolveTicketAttachmentUrl,
  getAttachmentDisplayName,
  stripHtmlTags
} from "./utils";
import type {
  AgentCompanyAssignment,
  ProfileRow,
  TicketEventRow,
  TicketDetailRow,
  CompanyInfo,
  StatsData,
  PeriodStat,
  ConsultantTicket
} from "./types";
import { renderDashboardUI } from "./renderUI";
import { usePagination } from "@/hooks/usePagination";

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role } = useUserRole();
  const { isAgent, agent, memberships, activeCompany, isLoading } = useAgentTenant();
  const isConsultantRole = role === "consultant";

  const [periodIdx, setPeriodIdx] = useState(2);
  const [expandCompanyId, setExpandCompanyId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");
  const [detailsTicketId, setDetailsTicketId] = useState<string | null>(null);

  const { data: detailsTicket, isLoading: isTicketDetailsLoading } = useQuery({
    queryKey: ["agent-ticket-details", detailsTicketId],
    queryFn: async () => {
      if (!detailsTicketId) return null;
      const { data, error } = await supabase.from("tickets").select("*").eq("id", detailsTicketId).maybeSingle();
      if (error) throw error;
      return (data || null) as TicketDetailRow | null;
    },
    enabled: !!detailsTicketId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["agent-assignments", agent?.id],
    queryFn: async () => {
      if (!agent?.id) return [];
      const { data, error } = await supabase
        .from("agent_company_assignments")
        .select("company_id, commission_percent, status, companies:companies!inner(name, slug)")
        .eq("agent_id", agent.id)
        .eq("status", "active");
      if (error) {
        console.error("Error fetching assignments:", error);
        return [];
      }
      return (data || []) as AgentCompanyAssignment[];
    },
    enabled: !!agent?.id,
  });

  const companyIds = useMemo(() => {
    const fromMemberships = memberships.map((m) => m.company_id);
    const fromAssignments = assignments.map((a) => a.company_id);
    return Array.from(new Set([...fromMemberships, ...fromAssignments]));
  }, [memberships, assignments]);

  const commissionForCompany = useMemo(() => {
    const map: Record<string, number> = {};
    assignments.forEach((a) => {
      map[a.company_id] = a.commission_percent ?? agent?.default_commission_percent ?? 0;
    });
    return map;
  }, [assignments, agent]);

  const allCompanies = useMemo(() => {
    const map = new Map<string, CompanyInfo>();
    memberships.forEach((m) => {
      if (m.companies) {
        map.set(m.company_id, {
          id: m.company_id,
          name: m.companies.name,
          slug: m.companies.slug,
        });
      }
    });
    assignments.forEach((a) => {
      // @ts-ignore
      if (a.companies && !map.has(a.company_id)) {
        // @ts-ignore
        const companyName = Array.isArray(a.companies) ? a.companies[0]?.name : a.companies?.name;
        // @ts-ignore
        const companySlug = Array.isArray(a.companies) ? a.companies[0]?.slug : a.companies?.slug;
        map.set(a.company_id, {
          id: a.company_id,
          name: companyName || "Unknown Company",
          slug: companySlug || "",
        });
      }
    });
    return Array.from(map.values());
  }, [memberships, assignments]);

  const { data: companySubscriptions = [] } = useQuery({
    queryKey: ["agent-company-subscriptions", companyIds],
    queryFn: async () => {
      if (!companyIds.length) return [];
      const { data, error } = await (supabase as any)
        .from("company_subscriptions")
        .select("*, subscription_plans(*)")
        .in("company_id", companyIds)
        .eq("status", "active")
        .gt("ends_at", new Date().toISOString());
      if (error) {
        console.error("Error fetching company subscriptions:", error);
        return [];
      }
      return (data || []) as CompanySubscription[];
    },
    enabled: companyIds.length > 0,
  });

  const subscriptionByCompanyId = useMemo(() => {
    const map: Record<string, CompanySubscription> = {};
    companySubscriptions.forEach((subscription) => {
      map[subscription.company_id] = subscription;
    });
    return map;
  }, [companySubscriptions]);

  const { data: allCompanyMembers = [] } = useQuery({
    queryKey: ["agent-all-company-members", companyIds],
    queryFn: async () => {
      if (!companyIds.length) return [];
      const { data, error } = await supabase
        .from("company_memberships")
        .select("company_id, user_id")
        .in("company_id", companyIds);
      if (error) {
        console.error("Error fetching company members:", error);
        return [];
      }
      return (data || []) as { company_id: string; user_id: string }[];
    },
    enabled: companyIds.length > 0,
  });

  const allMemberUserIds = useMemo(
    () => [...new Set(allCompanyMembers.map((m) => m.user_id))],
    [allCompanyMembers]
  );

  useEffect(() => {
    if (!allCompanies.length) {
      setSelectedCompanyId(null);
      return;
    }
    if (selectedCompanyId === null) return;
    const preferredId = activeCompany?.id || allCompanies[0].id;
    const exists = allCompanies.some((c) => c.id === selectedCompanyId);
    if (!exists) {
      setSelectedCompanyId(preferredId);
    }
  }, [allCompanies, activeCompany?.id, selectedCompanyId]);

  const memberCountByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    allCompanyMembers.forEach((m) => {
      map[m.company_id] = (map[m.company_id] || 0) + 1;
    });
    return map;
  }, [allCompanyMembers]);

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["agent-dashboard-profiles", allMemberUserIds],
    queryFn: async () => {
      if (!allMemberUserIds.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", allMemberUserIds)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }
      return (data || []) as ProfileRow[];
    },
    enabled: allMemberUserIds.length > 0,
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ["agent-company-tickets", companyIds, allMemberUserIds, user?.id, isConsultantRole],
    queryFn: async () => {
      if (!companyIds.length && !allMemberUserIds.length && !(isConsultantRole && user?.id)) return [];

      const filters: string[] = [];
      if (companyIds.length) filters.push(`company_id.in.(${companyIds.join(",")})`);
      if (allMemberUserIds.length) filters.push(`user_id.in.(${allMemberUserIds.join(",")})`);
      if (isConsultantRole && user?.id) filters.push(`assigned_consultant_id.eq.${user.id}`);

      const { data, error } = await supabase
        .from("tickets")
        .select("id, user_id, company_id, status, credit_cost, created_at, title, description, file_urls, priority, assigned_consultant_id, assignment_status")
        // @ts-ignore
        .or(filters.join(","))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        return [];
      }
      return data || [];
    },
    enabled: companyIds.length > 0 || allMemberUserIds.length > 0 || (isConsultantRole && !!user?.id),
  });

  const periodStats = useMemo(() => {
    const userCompanyMap: Record<string, string> = {};
    allCompanyMembers.forEach((m) => {
      userCompanyMap[m.user_id] = m.company_id;
    });

    const getCommission = (ticket: any) => {
      let cid = ticket.company_id;
      if (!cid) cid = userCompanyMap[ticket.user_id];
      if (!cid) return Number(agent?.default_commission_percent ?? 0);
      const comm = commissionForCompany[cid] ?? agent?.default_commission_percent ?? 0;
      return Number(comm);
    };

    const period = PERIODS[periodIdx];
    const cutoff = daysAgo(period.days);
    const inPeriod = allTickets.filter((t) => t.created_at >= cutoff);
    const resolved = inPeriod.filter((t) => TICKET_RESOLVED_STATUSES.includes(t.status as any));
    const open = allTickets.filter((t) => TICKET_OPEN_STATUSES.includes(t.status as any));

    const earned = resolved.reduce((acc, t) => {
      const comm = getCommission(t);
      const cost = Number(t.credit_cost ?? 0);
      return acc + (cost * (comm / 100));
    }, 0);

    const creditsConsumed = resolved.reduce((acc, t) => acc + Number(t.credit_cost ?? 0), 0);

    const potential = open.reduce((acc, t) => {
      const comm = getCommission(t);
      const cost = Number(t.credit_cost ?? 0);
      return acc + (cost * (comm / 100));
    }, 0);

    return {
      total: inPeriod.length,
      resolved: resolved.length,
      creditsConsumed,
      earned,
      openCount: open.length,
      potential,
    } as PeriodStat;
  }, [allTickets, periodIdx, agent, allCompanyMembers, commissionForCompany]);

  const companyStats = useMemo(() => {
    const map: Record<string, StatsData> = {};
    allCompanies.forEach((c) => {
      const tickets = allTickets.filter((t) => {
        if (t.company_id === c.id) return true;
        const membership = allCompanyMembers.find(m => m.user_id === t.user_id && m.company_id === c.id);
        return !!membership;
      });

      const open = tickets.filter((t) => TICKET_OPEN_STATUSES.includes(t.status as any));
      const resolved = tickets.filter((t) => TICKET_RESOLVED_STATUSES.includes(t.status as any));

      const comm = Number(commissionForCompany[c.id] ?? agent?.default_commission_percent ?? 0);
      const creditsConsumed = resolved.reduce((acc, t) => acc + Number(t.credit_cost ?? 0), 0);

      const earned = creditsConsumed * (comm / 100);
      const potential = open.reduce((acc, t) => acc + Number(t.credit_cost ?? 0), 0) * (comm / 100);

      map[c.id] = {
        tickets: tickets.length,
        openTickets: open.length,
        creditsConsumed,
        earned,
        potential,
      };
    });
    return map;
  }, [allCompanies, allCompanyMembers, allTickets, commissionForCompany, agent]);

  const focusedCompany = useMemo(
    () => allCompanies.find((c) => c.id === selectedCompanyId) || null,
    [allCompanies, selectedCompanyId]
  );

  const focusedStats = useMemo(
    () => (focusedCompany ? companyStats[focusedCompany.id] || { tickets: 0, openTickets: 0, creditsConsumed: 0, earned: 0, potential: 0 } : null),
    [focusedCompany, companyStats]
  );

  const focusedTickets = useMemo(() => {
    if (!focusedCompany) return allTickets;
    return allTickets.filter((t) => {
      const ticketCompanyId = t.company_id;
      return ticketCompanyId === focusedCompany.id;
    });
  }, [focusedCompany, allTickets]);

  const {
    page: ticketPage,
    setPage: setTicketPage,
    pageSize: ticketPageSize,
    paginatedItems: visibleFocusedTickets,
  } = usePagination(focusedTickets, { pageSize: TICKET_PAGE_SIZE, resetKey: focusedCompany?.id || "all" });

  const consultantAssignedTickets = useMemo(() => {
    if (!isConsultantRole || !user?.id) return [];
    return (allTickets as ConsultantTicket[]).filter((t) => t.assigned_consultant_id === user.id);
  }, [allTickets, isConsultantRole, user?.id]);

  const createCompanyMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (!user || !agent) throw new Error("Agent session not found");
      const payload: any = {
        name: formData.name,
        slug: formData.slug,
        status: "active",
        created_by: user.id,
        created_via_agent_id: agent.id,
        business_type: formData.businessType || null,
        annual_turnover: formData.annualTurnover ? parseFloat(formData.annualTurnover) : null,
        website: formData.website || null,
        address_line1: formData.addressLine1 || null,
        address_line2: formData.addressLine2 || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postalCode || null,
        country: formData.country || null,
        contact_name: formData.contactName || null,
        contact_email: formData.contactEmail || null,
        contact_phone: formData.contactPhone || null,
      };
      const { error } = await supabase.from("companies").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company created successfully");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["company-memberships", user?.id] });
    },
    onError: (err: Error) => {
      const pgError = err as Error & { code?: string; details?: string; hint?: string };
      const message = (pgError.message || "").toLowerCase();
      const details = (pgError.details || "").toLowerCase();
      const isSlugConflict = pgError.code === "23505" && (message.includes("slug") || details.includes("(slug)"));

      if (isSlugConflict) {
        toast.error("This slug is already in use globally. Try a different one.");
        return;
      }
      if (pgError.code === "42501" || message.includes("row-level security")) {
        toast.error("You are not allowed to create a company with this account.");
        return;
      }
      toast.error(getUserFacingError(pgError, "Operation failed. Please try again."));
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ companyId }: { companyId: string }) => {
      if (!newMemberName.trim()) throw new Error("Please enter a name.");
      if (!newMemberEmail.trim()) throw new Error("Please enter an email address.");

      return inviteCompanyMember({
        companyId,
        fullName: newMemberName.trim(),
        email: newMemberEmail.trim(),
        membershipRole: newMemberRole,
      });
    },
    onSuccess: () => {
      toast.success("Member invited successfully");
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("member");
      queryClient.invalidateQueries({ queryKey: ["agent-all-company-members", companyIds] });
    },
    onError: (err: Error) => toast.error(err.message || "Operation failed."),
  });

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          {isConsultantRole ? "Loading consultant workspace..." : "Loading agent workspace..."}
        </div>
      </ProtectedLayout>
    );
  }

  if (!isAgent && !isConsultantRole) {
    return (
      <ProtectedLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <p className="text-muted-foreground">
            {isConsultantRole ? "You don't have a consultant profile." : "You don't have an agent profile."}
          </p>
          <div onClick={() => navigate("/dashboard")} className="inline-block">Back to Dashboard</div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      {renderDashboardUI({
        isConsultantRole,
        agent,
        user,
        allCompanies,
        memberships,
        assignments,
        companyStats,
        subscriptionByCompanyId,
        memberCountByCompany,
        allProfiles,
        allTickets,
        allCompanyMembers,
        focusedCompany,
        focusedStats,
        focusedTickets,
        visibleFocusedTickets,
        ticketPage,
        setTicketPage,
        ticketPageSize,
        periodIdx,
        periodStats,
        expandCompanyId,
        selectedCompanyId,
        isCreateOpen,
        detailsTicketId,
        detailsTicket,
        isTicketDetailsLoading,
        newMemberName,
        newMemberEmail,
        newMemberRole,
        consultantAssignedTickets: consultantAssignedTickets as ConsultantTicket[],
        // Handlers
        setPeriodIdx,
        setExpandCompanyId,
        setSelectedCompanyId,
        setIsCreateOpen,
        setNewMemberName,
        setNewMemberEmail,
        setNewMemberRole,
        setDetailsTicketId,
        // Mutations
        createCompanyMutation,
        addMemberMutation,
        // Navigation
        navigate,
        // Utilities
        fmtCredits,
        stripHtmlTags,
        resolveTicketAttachmentUrl,
        getAttachmentDisplayName,
        sanitizeTicketHtml,
      })}
    </ProtectedLayout>
  );
}
