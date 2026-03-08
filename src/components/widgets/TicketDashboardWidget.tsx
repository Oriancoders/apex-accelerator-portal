import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Ticket, Clock, CheckCircle2, AlertCircle, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function TicketDashboardWidget() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets-summary", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("tickets").select("status").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Total", value: tickets.length, icon: Ticket, color: "text-foreground" },
    { label: "Open", value: tickets.filter((t) => t.status === "submitted" || t.status === "under_review").length, icon: AlertCircle, color: "text-info" },
    { label: "In Progress", value: tickets.filter((t) => t.status === "in_progress" || t.status === "approved").length, icon: Clock, color: "text-accent" },
    { label: "Completed", value: tickets.filter((t) => t.status === "completed").length, icon: CheckCircle2, color: "text-success" },
  ];

  return (
    <div className="widget-card">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Ticket Overview</h3>
        </div>
        <button onClick={() => navigate("/tickets")} className="text-primary text-xs hover:underline">View All</button>
      </div>
      <div className="widget-card-body">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Credit Balance</span>
          </div>
          <span className="text-lg font-bold text-accent">{profile?.credits ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
