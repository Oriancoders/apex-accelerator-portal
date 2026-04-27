import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Ticket, Clock, CheckCircle2, AlertCircle, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useUserRole } from "@/hooks/useUserRole";

interface TicketDashboardWidgetProps {
  companyId?: string;
  showCompanyWide?: boolean;
}

export default function TicketDashboardWidget({ companyId, showCompanyWide = false }: TicketDashboardWidgetProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { activeCompany } = useAgentTenant();
  const { role } = useUserRole();

  const ticketListPath =
    (role === "company_admin" || role === "member") && activeCompany?.slug
      ? `/${activeCompany.slug}/tickets`
      : "/tickets";

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets-summary", user?.id, companyId, showCompanyWide],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase.from("tickets").select("status");

      if (companyId) {
        query = query.eq("company_id", companyId);
        if (!showCompanyWide) {
          query = query.eq("user_id", user.id);
        }
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Total", value: tickets.length, icon: Ticket, color: "text-foreground", bg: "bg-muted/50" },
    { label: "Open", value: tickets.filter((t) => t.status === "submitted" || t.status === "under_review").length, icon: AlertCircle, color: "text-[hsl(var(--info))]", bg: "bg-[hsl(var(--info))]/5" },
    { label: "In Progress", value: tickets.filter((t) => t.status === "in_progress" || t.status === "approved").length, icon: Clock, color: "text-accent", bg: "bg-accent/5" },
    { label: "Completed", value: tickets.filter((t) => t.status === "completed").length, icon: CheckCircle2, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5" },
  ];

  return (
    <div className="widget-card h-full">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Ticket Overview</h3>
        </div>
        <button onClick={() => navigate(ticketListPath)} className="text-primary text-xs font-medium hover:underline">View All</button>
      </div>
      <div className="widget-card-body space-y-4">
        {/* Chunking: 2x2 grid for 4 stats — within Miller's 7±2 */}
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div key={s.label} className={`flex items-center gap-2.5 p-3 rounded-ds-md ${s.bg} min-h-[56px]`}>
              <s.icon className={`h-4.5 w-4.5 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Credit balance — Recognition over recall: always visible */}
        <div className="flex items-center justify-between p-3.5 rounded-ds-md bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Credit Balance</span>
          </div>
          <span className="text-xl font-bold text-accent">{profile?.credits ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
