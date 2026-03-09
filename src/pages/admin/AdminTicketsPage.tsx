import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProposalBuilder from "@/components/ProposalBuilder";
import TicketChat from "@/components/TicketChat";
import { toast } from "sonner";
import {
  format, formatDistanceToNow, differenceInMinutes,
} from "date-fns";
import {
  Search, Ticket, Filter, Lock, CheckCircle, XCircle, Clock,
  PlayCircle, Target, Award, ClipboardCheck, HelpCircle, Activity,
  MessageSquare, TrendingUp, BarChart3, Paperclip, ArrowRight,
  Zap, Star, AlertCircle, ChevronRight, Coins, Timer, FileText,
  Eye, Send,
} from "lucide-react";
import type { Tables, Database } from "@/integrations/supabase/types";

type TicketType = Tables<"tickets">;
type TicketEvent = Tables<"ticket_events">;
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

interface RoadmapItem { hour: number; title: string; description: string; }

// ── Design tokens ────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  submitted:    { label: "Submitted",    color: "text-warning",          bg: "bg-warning/10",     border: "border-warning/30",     icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
  under_review: { label: "Under Review", color: "text-primary",          bg: "bg-primary/10",     border: "border-primary/30",     icon: <HelpCircle className="h-3.5 w-3.5" /> },
  approved:     { label: "Approved",     color: "text-success",          bg: "bg-success/10",     border: "border-success/30",     icon: <CheckCircle className="h-3.5 w-3.5" /> },
  in_progress:  { label: "In Progress",  color: "text-accent",           bg: "bg-accent/10",      border: "border-accent/30",      icon: <PlayCircle className="h-3.5 w-3.5" /> },
  uat:          { label: "UAT",          color: "text-info",             bg: "bg-info/10",        border: "border-info/30",        icon: <Target className="h-3.5 w-3.5" /> },
  completed:    { label: "Completed",    color: "text-success",          bg: "bg-success/10",     border: "border-success/30",     icon: <Award className="h-3.5 w-3.5" /> },
  closed:       { label: "Closed",       color: "text-muted-foreground", bg: "bg-muted",          border: "border-border",         icon: <Lock className="h-3.5 w-3.5" /> },
  cancelled:    { label: "Cancelled",    color: "text-destructive",      bg: "bg-destructive/10", border: "border-destructive/30", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  low:      { color: "text-success",     bg: "bg-success/10" },
  medium:   { color: "text-warning",     bg: "bg-warning/10" },
  high:     { color: "text-accent",      bg: "bg-accent/10" },
  critical: { color: "text-destructive", bg: "bg-destructive/10" },
};

// Workflow-aware: what action is needed at each status
const STATUS_ACTION: Record<string, { label: string; desc: string; urgent?: boolean }> = {
  submitted:    { label: "Needs Proposal",     desc: "Write and submit a proposal for this ticket.",    urgent: true },
  under_review: { label: "Awaiting Approval",  desc: "Client is reviewing your proposal." },
  approved:     { label: "Start Work",         desc: "Client approved. Move to In Progress.",           urgent: true },
  in_progress:  { label: "In Development",     desc: "Move to UAT when work is ready.",                urgent: false },
  uat:          { label: "UAT Active",         desc: "Client is testing. Monitor for issues." },
  completed:    { label: "Ready to Close",     desc: "Client confirmed. Close the ticket.",             urgent: true },
  closed:       { label: "Archived",           desc: "This ticket is closed." },
  cancelled:    { label: "Cancelled",          desc: "This ticket was cancelled." },
};

const ALL_STATUSES: TicketStatus[] = [
  "submitted", "under_review", "approved", "in_progress", "uat", "completed", "closed", "cancelled"
];

function formatDur(mins: number) {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.submitted;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${m.bg} ${m.color} ${m.border}`}>
      {m.icon}
      {m.label}
    </span>
  );
}

// ── Progress Stepper ──────────────────────────────────────────────────────────
const STAGES = ["submitted", "under_review", "approved", "in_progress", "uat", "completed", "closed"] as const;
const STAGE_IDX: Record<string, number> = { submitted: 0, under_review: 1, approved: 2, in_progress: 3, uat: 4, completed: 5, closed: 6, cancelled: -1 };

function ProgressStepper({ status }: { status: string }) {
  const currentIdx = STAGE_IDX[status] ?? 0;
  if (status === "cancelled") return (
    <div className="flex items-center gap-2 py-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Cancelled
      </span>
    </div>
  );
  return (
    <div className="relative pt-2 pb-1">
      <div className="absolute top-[26px] left-5 right-5 h-0.5 bg-border" />
      <div
        className="absolute top-[26px] left-5 h-0.5 bg-primary transition-all duration-700"
        style={{ width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% - 2.5rem)` }}
      />
      <div className="flex justify-between relative">
        {STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={stage} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                done ? "bg-primary border-primary text-primary-foreground"
                : active ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-card border-border text-muted-foreground"
              }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight max-w-[50px] ${
                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              }`}>{STATUS_META[stage]?.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
function TicketTimeline({ events }: { events: TicketEvent[] }) {
  if (!events.length) return (
    <div className="text-center py-10 text-muted-foreground text-sm">
      <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
      No status changes recorded yet.
    </div>
  );
  return (
    <div className="relative space-y-0">
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
      {events.map((ev, i) => {
        const next = events[i + 1];
        const durMins = next
          ? differenceInMinutes(new Date(next.created_at), new Date(ev.created_at))
          : differenceInMinutes(new Date(), new Date(ev.created_at));
        const m = STATUS_META[ev.to_status] || STATUS_META.submitted;
        return (
          <div key={ev.id} className="relative pl-14 pb-6">
            <div className={`absolute left-2.5 top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${m.bg} ${m.border}`}>
              <span className={m.color}>{m.icon}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {ev.from_status && (
                    <>
                      <StatusBadge status={ev.from_status} />
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </>
                  )}
                  <StatusBadge status={ev.to_status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(ev.created_at), "MMM d, yyyy · h:mm a")}
                  <span className="mx-1.5 text-border">·</span>
                  {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                </p>
                {ev.note && (
                  <p className="text-xs text-foreground mt-2 bg-muted/60 px-3 py-2 rounded-lg border border-border">
                    {ev.note}
                  </p>
                )}
                {ev.attachments && ev.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ev.attachments.map((url, ai) => (
                      <a key={ai} href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg">
                        <Paperclip className="h-3 w-3" /> Attachment {ai + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {i < events.length - 1 && (
                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {formatDur(durMins)} here
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Lifecycle Stats ───────────────────────────────────────────────────────────
function LifecycleStats({ events, ticket }: { events: TicketEvent[]; ticket: TicketType }) {
  const totalMins = events.length > 1
    ? differenceInMinutes(new Date(events[events.length - 1].created_at), new Date(events[0].created_at))
    : 0;

  const stageDurations: { stage: string; mins: number }[] = [];
  for (let i = 0; i < events.length - 1; i++) {
    const mins = differenceInMinutes(new Date(events[i + 1].created_at), new Date(events[i].created_at));
    stageDurations.push({ stage: events[i].to_status, mins });
  }
  const maxMins = Math.max(...stageDurations.map((s) => s.mins), 1);

  return (
    <div className="space-y-5">
      {/* KPI chips */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-center">
          <Timer className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{formatDur(totalMins)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Time</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/15 text-center">
          <Coins className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{ticket.credit_cost ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Credits</p>
        </div>
        <div className="p-4 rounded-xl bg-success/5 border border-success/15 text-center">
          <Activity className="h-5 w-5 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{events.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Events</p>
        </div>
      </div>

      {/* Bar chart of stage durations */}
      {stageDurations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Time per Stage</p>
          {stageDurations.map((s, i) => {
            const m = STATUS_META[s.stage] || STATUS_META.submitted;
            const pct = Math.round((s.mins / maxMins) * 100);
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={`font-medium ${m.color}`}>{m.label}</span>
                  <span className="text-muted-foreground">{formatDur(s.mins)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── UAT Panel (admin sends to UAT) ───────────────────────────────────────────
function UATPanel({ ticket, onUpdate }: { ticket: TicketType; onUpdate: () => void }) {
  const [uatNotes, setUatNotes] = useState(ticket.uat_notes || "");
  const [uatUrl, setUatUrl] = useState((ticket.uat_attachments || [])[0] || "");
  const [saving, setSaving] = useState(false);

  const sendToUAT = async () => {
    setSaving(true);
    const attachments = uatUrl ? [uatUrl] : [];
    const { error } = await supabase.from("tickets").update({
      status: "uat" as TicketStatus,
      uat_notes: uatNotes || null,
      uat_attachments: attachments.length ? attachments : null,
    }).eq("id", ticket.id);
    if (error) { toast.error(error.message); }
    else {
      await supabase.from("ticket_events").insert({
        ticket_id: ticket.id,
        from_status: ticket.status,
        to_status: "uat",
        note: uatNotes || "Admin moved ticket to UAT.",
        attachments: attachments.length ? attachments : null,
      });
      toast.success("Ticket sent to UAT! Client notified.");
      onUpdate();
    }
    setSaving(false);
  };

  if (ticket.status === "uat") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-info/10 border border-info/20">
          <Target className="h-4 w-4 text-info flex-shrink-0" />
          <p className="text-sm text-foreground font-medium">Ticket is currently in UAT. Client is reviewing.</p>
        </div>
        {ticket.uat_notes && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes Sent to Client</p>
            <p className="text-sm text-foreground bg-muted/60 p-3 rounded-xl border border-border">{ticket.uat_notes}</p>
          </div>
        )}
        {ticket.uat_attachments && ticket.uat_attachments.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Deliverable Links</p>
            <div className="space-y-2">
              {ticket.uat_attachments.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 border border-primary/20 p-2.5 rounded-xl">
                  <Paperclip className="h-4 w-4" /> {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!["in_progress", "approved"].includes(ticket.status)) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
        UAT panel is available once the ticket is In Progress or Approved.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Send to UAT</p>
          <p className="text-xs text-muted-foreground mt-0.5">Attach deliverable links and write UAT notes for the client before sending.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Deliverable URL / Link
          </label>
          <Input
            placeholder="https://staging.example.com or Google Drive link..."
            value={uatUrl}
            onChange={(e) => setUatUrl(e.target.value)}
            className="rounded-xl h-10"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            UAT Notes for Client
          </label>
          <Textarea
            placeholder="Explain what was built, what to test, known limitations, access credentials if any..."
            value={uatNotes}
            onChange={(e) => setUatNotes(e.target.value)}
            rows={5}
            className="rounded-xl resize-none"
          />
        </div>
      </div>

      <Button
        className="w-full rounded-xl h-11 gap-2"
        onClick={sendToUAT}
        disabled={saving}
      >
        <Target className="h-4 w-4" />
        {saving ? "Sending to UAT..." : "Send to UAT →"}
      </Button>
    </div>
  );
}

// ── Ticket Detail Dialog ──────────────────────────────────────────────────────
function TicketDialog({
  ticket,
  onClose,
  onRefresh,
}: {
  ticket: TicketType;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const [dialogTab, setDialogTab] = useState<string>("details");

  // Determine smart default tab based on status (Hick's Law)
  const getDefaultTab = (status: string) => {
    if (status === "submitted") return "proposal";
    return "details";
  };

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ["admin-ticket-events", ticket.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      return (data || []) as TicketEvent[];
    },
  });

  const { data: ticketReview } = useQuery({
    queryKey: ["admin-ticket-review", ticket.id],
    queryFn: async () => {
      const { data } = await supabase.from("ticket_reviews").select("*").eq("ticket_id", ticket.id).maybeSingle();
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: TicketStatus; note?: string }) => {
      const { error } = await supabase.from("tickets").update({ status }).eq("id", ticket.id);
      if (error) throw error;
      await supabase.from("ticket_events").insert({
        ticket_id: ticket.id,
        from_status: ticket.status,
        to_status: status,
        note: note || `Admin changed status to ${status.replace("_", " ")}.`,
      });
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-events", ticket.id] });
      refetchEvents();
      onRefresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitProposalMutation = useMutation({
    mutationFn: async ({ steps, estimatedHours, creditCost, expertOpinion, difficultyLevel }: {
      steps: RoadmapItem[]; estimatedHours: number; creditCost: number; expertOpinion: string; difficultyLevel: "easy" | "medium" | "hard" | "expert";
    }) => {
      const { error } = await supabase.from("tickets").update({
        solution_roadmap: steps as any,
        estimated_hours: estimatedHours,
        credit_cost: creditCost,
        expert_opinion: expertOpinion,
        difficulty_level: difficultyLevel as any,
        status: "under_review" as TicketStatus,
      }).eq("id", ticket.id);
      if (error) throw error;
      await supabase.from("ticket_events").insert({
        ticket_id: ticket.id,
        from_status: ticket.status,
        to_status: "under_review",
        note: "Admin submitted proposal. Awaiting client approval.",
      });
    },
    onSuccess: () => {
      toast.success("Proposal submitted! Ticket moved to Under Review.");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      onRefresh();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const roadmap = (ticket.solution_roadmap as unknown) as RoadmapItem[] | null;
  const hasProposal = roadmap && roadmap.length > 0 && ticket.credit_cost;
  const action = STATUS_ACTION[ticket.status];
  const sm = STATUS_META[ticket.status] || STATUS_META.submitted;
  const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;

  // Tabs: chunked, context-aware (Miller's Law: ≤7 items)
  const tabs = [
    { id: "details",  label: "Details",  icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "proposal", label: "Proposal", icon: <Zap className="h-3.5 w-3.5" /> },
    ...(["in_progress", "approved", "uat"].includes(ticket.status)
      ? [{ id: "uat", label: "UAT", icon: <Target className="h-3.5 w-3.5" /> }]
      : []),
    { id: "timeline", label: "Timeline", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "chat",     label: "Chat",     icon: <MessageSquare className="h-3.5 w-3.5" /> },
    ...(ticket.status === "closed" ? [{ id: "stats", label: "Stats", icon: <BarChart3 className="h-3.5 w-3.5" /> }] : []),
  ];

  // Smart default tab on open
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    setDialogTab(getDefaultTab(ticket.status));
    setInitialized(true);
  }

  return (
    <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl mx-4 sm:mx-auto p-0">
      {/* ── Header ── */}
      <div className={`px-6 py-4 border-b ${sm.bg} ${sm.border} border-b`}>
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={ticket.status} />
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${pm.bg} ${pm.color}`}>
                {ticket.priority} priority
              </span>
              {action?.urgent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="h-3 w-3" /> Action Required
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-foreground leading-snug truncate">{ticket.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              #{ticket.id.slice(0, 8)} · Created {format(new Date(ticket.created_at), "MMM d, yyyy")}
              {ticket.contact_email && ` · ${ticket.contact_email}`}
            </p>
          </div>
        </div>
        {/* Progress stepper */}
        <div className="mt-3">
          <ProgressStepper status={ticket.status} />
        </div>
      </div>

      {/* ── Next Action Banner (Hick's Law: one primary action) ── */}
      {action && ticket.status !== "closed" && ticket.status !== "cancelled" && (
        <div className="px-6 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              <span className="font-semibold text-foreground">{action.label}:</span> {action.desc}
            </span>
          </div>
          {/* Context-aware quick actions */}
          <div className="flex gap-1.5 flex-shrink-0">
            {ticket.status === "submitted" && (
              <Button size="sm" className="h-7 text-xs rounded-lg gap-1" onClick={() => setDialogTab("proposal")}>
                <Send className="h-3 w-3" /> Write Proposal
              </Button>
            )}
            {ticket.status === "approved" && (
              <Button size="sm" className="h-7 text-xs rounded-lg gap-1"
                onClick={() => updateStatusMutation.mutate({ status: "in_progress", note: "Admin started development." })}>
                <PlayCircle className="h-3 w-3" /> Start Work
              </Button>
            )}
            {ticket.status === "in_progress" && (
              <Button size="sm" className="h-7 text-xs rounded-lg gap-1" onClick={() => setDialogTab("uat")}>
                <Target className="h-3 w-3" /> Send to UAT
              </Button>
            )}
            {ticket.status === "completed" && (
              <Button size="sm" className="h-7 text-xs rounded-lg gap-1"
                onClick={() => updateStatusMutation.mutate({ status: "closed", note: "Admin closed the ticket." })}>
                <Lock className="h-3 w-3" /> Close Ticket
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={dialogTab} onValueChange={setDialogTab} className="h-full flex flex-col">
          <div className="px-6 pt-3 border-b border-border">
            <TabsList className="h-9 bg-transparent p-0 gap-0 border-none rounded-none">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="h-9 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary text-xs gap-1.5"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── DETAILS TAB ── */}
          <TabsContent value="details" className="flex-1 p-6 space-y-5 mt-0">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Priority</p>
                <span className={`text-sm font-semibold capitalize ${pm.color}`}>{ticket.priority}</span>
              </div>
              {ticket.credit_cost != null && (
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/15 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Credits</p>
                  <p className="text-lg font-bold text-accent">{ticket.credit_cost}</p>
                </div>
              )}
              {ticket.estimated_hours != null && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Est. Hours</p>
                  <p className="text-lg font-bold text-primary">{ticket.estimated_hours}h</p>
                </div>
              )}
              {ticket.difficulty_level && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border col-span-2 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Difficulty</p>
                  <p className="text-sm font-semibold capitalize text-foreground">{ticket.difficulty_level}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <div
                className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-xl border border-border text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            </div>

            {/* Expert Opinion (if set) */}
            {ticket.expert_opinion && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expert Opinion</p>
                <p className="text-sm text-foreground bg-primary/5 border border-primary/15 p-4 rounded-xl leading-relaxed">
                  {ticket.expert_opinion}
                </p>
              </div>
            )}

            {/* Client Review (if exists) */}
            {ticketReview && (
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <p className="text-xs font-semibold text-success uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" /> Client Review
                </p>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Overall", val: ticketReview.rating_overall },
                    { label: "Timeliness", val: ticketReview.rating_timeliness },
                    { label: "Value", val: ticketReview.rating_value },
                  ].map(({ label, val }) => val != null && (
                    <div key={label} className="text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                      <div className="flex justify-center gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= val ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {ticketReview.comment && (
                  <p className="text-xs text-foreground bg-background/60 p-3 rounded-lg border border-border italic">
                    "{ticketReview.comment}"
                  </p>
                )}
              </div>
            )}

            {/* Status update buttons: chunked into logical groups */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {ALL_STATUSES.map((s) => (
                  <Button
                    key={s}
                    variant={ticket.status === s ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg h-8 text-xs"
                    disabled={ticket.status === s || updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ status: s })}
                  >
                    {STATUS_META[s]?.label || s}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── PROPOSAL TAB ── */}
          <TabsContent value="proposal" className="p-6 mt-0">
            {ticket.status === "submitted" ? (
              <ProposalBuilder
                priority={ticket.priority}
                initialSteps={(ticket.solution_roadmap as unknown as RoadmapItem[]) || undefined}
                initialHours={ticket.estimated_hours || undefined}
                initialCost={ticket.credit_cost || undefined}
                initialOpinion={ticket.expert_opinion || ""}
                initialDifficulty={(ticket as any).difficulty_level || undefined}
                loading={submitProposalMutation.isPending}
                onSubmit={(data) =>
                  submitProposalMutation.mutate({
                    steps: data.steps,
                    estimatedHours: data.estimatedHours,
                    creditCost: data.creditCost,
                    expertOpinion: data.expertOpinion,
                    difficultyLevel: data.difficultyLevel,
                  })
                }
              />
            ) : hasProposal ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-center">
                    <Timer className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{ticket.estimated_hours}h</p>
                    <p className="text-[10px] text-muted-foreground">Est. Hours</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/15 text-center">
                    <Coins className="h-5 w-5 text-accent mx-auto mb-1" />
                    <p className="text-lg font-bold">{ticket.credit_cost}</p>
                    <p className="text-[10px] text-muted-foreground">Credits</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted border border-border text-center capitalize">
                    <Zap className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold">{(ticket as any).difficulty_level || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Difficulty</p>
                  </div>
                </div>
                {ticket.expert_opinion && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expert Opinion</p>
                    <p className="text-sm text-foreground bg-muted/50 p-4 rounded-xl border border-border leading-relaxed">{ticket.expert_opinion}</p>
                  </div>
                )}
                {roadmap && roadmap.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Solution Roadmap</p>
                    <div className="relative space-y-0">
                      <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-border" />
                      {roadmap.map((item, i) => (
                        <div key={i} className="relative pl-10 pb-4">
                          <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                          </div>
                          <div className="p-3 bg-muted/40 rounded-xl border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary">Hour {item.hour}</span>
                              <span className="text-sm font-semibold text-foreground">{item.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Re-edit proposal if still under_review */}
                {ticket.status === "under_review" && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-3">Proposal is awaiting client approval. You can edit below:</p>
                    <ProposalBuilder
                      priority={ticket.priority}
                      initialSteps={(ticket.solution_roadmap as unknown as RoadmapItem[]) || undefined}
                      initialHours={ticket.estimated_hours || undefined}
                      initialCost={ticket.credit_cost || undefined}
                      initialOpinion={ticket.expert_opinion || ""}
                      initialDifficulty={(ticket as any).difficulty_level || undefined}
                      loading={submitProposalMutation.isPending}
                      onSubmit={(data) =>
                        submitProposalMutation.mutate({
                          steps: data.steps,
                          estimatedHours: data.estimatedHours,
                          creditCost: data.creditCost,
                          expertOpinion: data.expertOpinion,
                          difficultyLevel: data.difficultyLevel,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No proposal submitted yet.</p>
              </div>
            )}
          </TabsContent>

          {/* ── UAT TAB ── */}
          <TabsContent value="uat" className="p-6 mt-0">
            <UATPanel
              ticket={ticket}
              onUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
                queryClient.invalidateQueries({ queryKey: ["admin-ticket-events", ticket.id] });
                refetchEvents();
                onRefresh();
              }}
            />
          </TabsContent>

          {/* ── TIMELINE TAB ── */}
          <TabsContent value="timeline" className="p-6 mt-0">
            <TicketTimeline events={events} />
          </TabsContent>

          {/* ── CHAT TAB ── */}
          <TabsContent value="chat" className="p-6 mt-0">
            <TicketChat ticketId={ticket.id} isAdmin />
          </TabsContent>

          {/* ── STATS TAB (closed tickets) ── */}
          <TabsContent value="stats" className="p-6 mt-0">
            <LifecycleStats events={events} ticket={ticket} />
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as TicketType[];
    },
  });

  const filtered = tickets.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summary counts for the filter tabs
  const counts = {
    all: tickets.length,
    action: tickets.filter((t) => STATUS_ACTION[t.status]?.urgent).length,
    submitted: tickets.filter((t) => t.status === "submitted").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    uat: tickets.filter((t) => t.status === "uat").length,
    completed: tickets.filter((t) => t.status === "completed").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Manage Tickets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{tickets.length} total · {counts.action} need action</p>
          </div>
          {counts.action > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {counts.action} urgent
            </span>
          )}
        </div>

        {/* Stats row — Chunking: scannable at-a-glance */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Submitted",   count: counts.submitted,   color: "text-warning",   bg: "bg-warning/5   border-warning/20",   icon: <ClipboardCheck className="h-4 w-4" /> },
            { label: "In Progress", count: counts.in_progress, color: "text-accent",    bg: "bg-accent/5    border-accent/20",    icon: <PlayCircle    className="h-4 w-4" /> },
            { label: "UAT",         count: counts.uat,         color: "text-info",      bg: "bg-info/5      border-info/20",      icon: <Target        className="h-4 w-4" /> },
            { label: "Completed",   count: counts.completed,   color: "text-success",   bg: "bg-success/5   border-success/20",   icon: <Award         className="h-4 w-4" /> },
          ].map(({ label, count, color, bg, icon }) => (
            <div key={label} className={`p-3 rounded-xl border ${bg} text-center cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setStatusFilter(label.toLowerCase().replace(" ", "_") as string)}>
              <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
              <p className={`text-xl font-bold ${color}`}>{count}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <Card className="rounded-2xl">
          <CardHeader className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s]?.label || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="px-0 sm:px-6 pb-4">
            {isLoading ? (
              <div className="space-y-3 px-4 sm:px-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%]">Ticket</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((ticket) => {
                        const action = STATUS_ACTION[ticket.status];
                        return (
                          <TableRow
                            key={ticket.id}
                            className="group cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <TableCell className="py-3">
                              <div className="flex items-start gap-2">
                                {action?.urgent && (
                                  <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-foreground truncate max-w-[260px]">{ticket.title}</p>
                                  <p className="text-[11px] text-muted-foreground">#{ticket.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><StatusBadge status={ticket.status} /></TableCell>
                            <TableCell>
                              <span className={`text-xs font-semibold capitalize ${PRIORITY_META[ticket.priority]?.color}`}>
                                {ticket.priority}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold text-accent">{ticket.credit_cost ?? "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(ticket.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                            <Ticket className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No tickets found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2 px-4">
                  {filtered.map((ticket) => {
                    const action = STATUS_ACTION[ticket.status];
                    return (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-xl border border-border hover:bg-muted/40 transition-colors cursor-pointer active:scale-[0.99]"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-foreground line-clamp-2 flex-1">{ticket.title}</p>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-semibold capitalize ${PRIORITY_META[ticket.priority]?.color}`}>
                            {ticket.priority}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{format(new Date(ticket.created_at), "MMM d")}</span>
                          {ticket.credit_cost && (
                            <span className="text-[11px] font-bold text-accent">{ticket.credit_cost} cr</span>
                          )}
                          {action?.urgent && (
                            <span className="text-[11px] font-semibold text-destructive flex items-center gap-0.5">
                              <AlertCircle className="h-3 w-3" /> Action needed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Ticket className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No tickets found</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        {selectedTicket && (
          <TicketDialog
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
              refetch().then((res) => {
                if (res.data) {
                  const updated = (res.data as TicketType[]).find((t) => t.id === selectedTicket.id);
                  if (updated) setSelectedTicket(updated);
                }
              });
            }}
          />
        )}
      </Dialog>
    </AdminLayout>
  );
}
