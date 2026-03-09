import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle, ArrowRight, Calendar, Coins,
  CheckCircle, Lock, BarChart3, Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { STATUS_META, PRIORITY_META, FILTER_TABS, isActiveStatus } from "@/constants/ticket";
import StatusBadge from "@/shared/StatusBadge";
import PriorityBadge from "@/shared/PriorityBadge";
import EmptyState from "@/shared/EmptyState";

type Ticket = Tables<"tickets">;

export default function TicketsPage() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [realtimePulse, setRealtimePulse] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef<Record<string, string>>({});

  const pulse = useCallback(() => {
    setRealtimePulse(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setRealtimePulse(false), 2000);
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []) as Ticket[];
    },
    enabled: !!user && !isGuest,
  });

  // Realtime subscription — update list instantly when ticket changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("client-tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Ticket | undefined;
          if (updated && payload.eventType === "UPDATE") {
            const prev = prevStatusRef.current[updated.id];
            if (prev && prev !== updated.status) {
              const statusLabel = updated.status.replace(/_/g, " ");
              toast.info(`Ticket status updated to "${statusLabel}"`, {
                description: updated.title,
                duration: 5000,
              });
            }
            prevStatusRef.current[updated.id] = updated.status;
          }
          queryClient.invalidateQueries({ queryKey: ["tickets", user.id] });
          pulse();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [user, queryClient, pulse]);

  // Seed prevStatusRef when tickets first load
  useEffect(() => {
    if (tickets.length > 0 && Object.keys(prevStatusRef.current).length === 0) {
      const map: Record<string, string> = {};
      tickets.forEach(t => { map[t.id] = t.status; });
      prevStatusRef.current = map;
    }
  }, [tickets]);

  if (isGuest) {
    return (
      <ProtectedLayout>
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create an account to submit and track service requests.</p>
          <Button onClick={() => navigate("/auth")} className="gap-2 rounded-xl h-11">
            Get Started
          </Button>
        </div>
      </ProtectedLayout>
    );
  }

  const filtered = tickets.filter((t) => {
    if (filter === "active") return isActiveStatus(t.status);
    if (filter === "completed") return ["completed", "closed"].includes(t.status);
    if (filter === "cancelled") return t.status === "cancelled";
    return true;
  });

  const activeCount = tickets.filter(t => isActiveStatus(t.status)).length;
  const doneCount = tickets.filter(t => ["completed", "closed"].includes(t.status)).length;

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">My Tickets</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">{tickets.length} total · {activeCount} active · {doneCount} completed</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-500 ${realtimePulse ? "bg-success/20 border-success/40 text-success scale-110" : "bg-success/10 border-success/20 text-success"}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-success ${realtimePulse ? "animate-ping" : "animate-pulse"}`} />
                Live
              </span>
            </div>
          </div>
          <Button onClick={() => navigate("/tickets/new")} className="gap-2 rounded-xl h-11 font-semibold">
            <PlusCircle className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {/* Quick stats (Miller's Law — max 3 chunks) */}
        {tickets.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{activeCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Active</p>
              </div>
            </div>
            <div className="p-3 bg-success/5 border border-success/15 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{doneCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Completed</p>
              </div>
            </div>
            <div className="p-3 bg-accent/5 border border-accent/15 rounded-xl flex items-center gap-3">
              <Coins className="h-5 w-5 text-accent flex-shrink-0" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{tickets.reduce((a, t) => a + (t.credit_cost ?? 0), 0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Credits Used</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar (Hick's Law — few clear choices) */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map(ft => (
            <button
              key={ft.key}
              onClick={() => setFilter(ft.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap border ${
                filter === ft.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              {ft.label}
              {ft.key === "active" && activeCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-primary-foreground/20">{activeCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <ClipboardCheck className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
              </h3>
              <p className="text-muted-foreground text-sm mb-5">
                {filter === "all" ? "Submit your first request to get started." : "Check other filters."}
              </p>
              {filter === "all" && (
                <Button onClick={() => navigate("/tickets/new")} className="gap-2 rounded-xl">
                  <PlusCircle className="h-4 w-4" />
                  Create Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => {
              const sm = STATUS_META[ticket.status] || STATUS_META["submitted"];
              const pm = PRIORITY_META[ticket.priority] || PRIORITY_META["medium"];
              const needsAction = ticket.status === "under_review" || ticket.status === "uat";

              return (
                <Card
                  key={ticket.id}
                  className={`rounded-2xl hover:shadow-md transition-all cursor-pointer group border ${
                    needsAction ? "border-warning/30 bg-warning/3" : "border-border"
                  }`}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sm.bg}`}>
                        <span className={sm.color}>{sm.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {ticket.title}
                          </h3>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sm.bg} ${sm.color}`}>
                            {sm.label}
                          </span>
                          {/* Priority */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pm.bg} ${pm.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />
                            {ticket.priority}
                          </span>
                          {/* Cost */}
                          {ticket.credit_cost && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Coins className="h-3 w-3 text-accent" />
                              {ticket.credit_cost} cr
                            </span>
                          )}
                          {/* Time */}
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Action indicator */}
                        {needsAction && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-md text-[10px] font-semibold">
                            <BarChart3 className="h-3 w-3" />
                            Action Required
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
