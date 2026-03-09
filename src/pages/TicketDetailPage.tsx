import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import TicketChat from "@/components/TicketChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, FileText, Clock, CheckCircle, XCircle, Coins, Timer,
  Info, Star, MessageSquare, TrendingUp, Activity, AlertTriangle,
  ChevronRight, ExternalLink, Calendar, Zap, Target, Award,
  ClipboardCheck, Lock, BarChart3, PlayCircle, HelpCircle
} from "lucide-react";
import { format, formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { sanitizeHtml } from "@/lib/sanitize";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"tickets">;
type TicketEvent = Tables<"ticket_events">;

interface SubTask { title: string; }
interface RoadmapItem { hour: number; title: string; description: string; subtasks?: SubTask[]; }

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  submitted:    { label: "Submitted",    color: "text-warning",     bg: "bg-warning/10 border-warning/20",     icon: <ClipboardCheck className="h-4 w-4" />, desc: "Your request has been received and is waiting for expert review." },
  under_review: { label: "Under Review", color: "text-primary",     bg: "bg-primary/10 border-primary/20",     icon: <HelpCircle className="h-4 w-4" />,     desc: "Our expert team is analyzing your request and preparing a proposal." },
  approved:     { label: "Approved",     color: "text-success",     bg: "bg-success/10 border-success/20",     icon: <CheckCircle className="h-4 w-4" />,    desc: "You approved the proposal. Work is about to begin." },
  in_progress:  { label: "In Progress",  color: "text-accent",      bg: "bg-accent/10 border-accent/20",       icon: <PlayCircle className="h-4 w-4" />,     desc: "Our team is actively working on your request." },
  uat:          { label: "UAT",          color: "text-info",        bg: "bg-info/10 border-info/20",           icon: <Target className="h-4 w-4" />,         desc: "The work is ready. Please test and confirm the deliverables." },
  completed:    { label: "Completed",    color: "text-success",     bg: "bg-success/10 border-success/20",     icon: <Award className="h-4 w-4" />,          desc: "Work is confirmed complete. Awaiting final closure." },
  closed:       { label: "Closed",       color: "text-muted-foreground", bg: "bg-muted border-border",        icon: <Lock className="h-4 w-4" />,           desc: "This ticket has been closed and archived." },
  cancelled:    { label: "Cancelled",    color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", icon: <XCircle className="h-4 w-4" />,   desc: "This ticket was cancelled." },
};

const PRIORITY_META: Record<string, { color: string; bg: string; dot: string }> = {
  low:      { color: "text-success",     bg: "bg-success/10",     dot: "bg-success" },
  medium:   { color: "text-warning",     bg: "bg-warning/10",     dot: "bg-warning" },
  high:     { color: "text-accent",      bg: "bg-accent/10",      dot: "bg-accent" },
  critical: { color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
};

const STAGES = ["submitted", "under_review", "approved", "in_progress", "uat", "completed", "closed"] as const;
const STAGE_IDX: Record<string, number> = { submitted: 0, under_review: 1, approved: 2, in_progress: 3, uat: 4, completed: 5, closed: 6, cancelled: -1 };

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / (60 * 24))}d`;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hover || value) ? "fill-warning text-warning" : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressStepper({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const currentIdx = STAGE_IDX[status] ?? 0;

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-3 px-1 overflow-x-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
          <XCircle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold text-destructive">Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-3 pb-1">
      {/* Track line */}
      <div className="absolute top-[22px] left-4 right-4 h-0.5 bg-border" />
      <div
        className="absolute top-[22px] left-4 h-0.5 bg-primary transition-all duration-700"
        style={{ width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% - 2rem)` }}
      />
      <div className="flex justify-between relative">
        {STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={stage} className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                done
                  ? "bg-primary border-primary text-primary-foreground"
                  : active
                  ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-card border-border text-muted-foreground"
              }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight max-w-[52px] ${
                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              }`}>
                {STATUS_META[stage]?.label || stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [review, setReview] = useState({ overall: 0, timeliness: 0, value: 0, comment: "" });
  const [activeTab, setActiveTab] = useState("overview");

  const { data: ticket, isLoading, refetch } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("tickets").select("*").eq("id", id).single();
      return data as Ticket | null;
    },
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["ticket-events", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });
      return (data || []) as TicketEvent[];
    },
    enabled: !!id,
  });

  const { data: existingReview } = useQuery({
    queryKey: ["ticket-review", id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data } = await supabase.from("ticket_reviews").select("*").eq("ticket_id", id).eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const handleProceed = async () => {
    if (!ticket || !user) return;
    if (!ticket.credit_cost) { toast.error("No credit cost assigned yet."); return; }
    const credits = profile?.credits ?? 0;
    if (credits < ticket.credit_cost) {
      toast.error(`Insufficient credits (${credits}/${ticket.credit_cost}).`);
      navigate("/credits"); return;
    }
    const { data, error } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: ticket.credit_cost,
      p_ticket_id: ticket.id, p_description: `Service: ${ticket.title}`,
    });
    if (error) { toast.error("Failed: " + error.message); }
    else if (data === false) { toast.error("Insufficient credits."); navigate("/credits"); }
    else {
      // log event
      await supabase.from("ticket_events").insert({ ticket_id: ticket.id, from_status: "under_review", to_status: "approved", changed_by: user.id, note: "Client approved proposal and paid." });
      toast.success("Credits deducted! Work begins soon."); await refreshProfile(); refetch();
    }
  };

  const handleCancel = async () => {
    if (!ticket || !user) return;
    const { error } = await supabase.from("tickets").update({ status: "cancelled" }).eq("id", ticket.id);
    if (!error) {
      await supabase.from("ticket_events").insert({ ticket_id: ticket.id, from_status: ticket.status, to_status: "cancelled", changed_by: user.id, note: "Client cancelled the ticket." });
      toast.success("Ticket cancelled."); refetch();
    } else toast.error(error.message);
  };

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !ticket) throw new Error("Not authenticated");
      if (review.overall === 0) throw new Error("Please rate Overall quality.");
      // Submit review
      const { error: rErr } = await supabase.from("ticket_reviews").insert({
        ticket_id: ticket.id, user_id: user.id,
        rating_overall: review.overall, rating_timeliness: review.timeliness || null,
        rating_value: review.value || null, comment: review.comment || null,
      });
      if (rErr) throw rErr;
      // Mark completed
      const { error: tErr } = await supabase.from("tickets").update({ status: "completed" }).eq("id", ticket.id);
      if (tErr) throw tErr;
      await supabase.from("ticket_events").insert({ ticket_id: ticket.id, from_status: "uat", to_status: "completed", changed_by: user.id, note: "Client confirmed work and submitted review." });
    },
    onSuccess: async () => {
      toast.success("Thank you for your review! Ticket marked as completed.");
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["ticket-review", id] });
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-2xl" />
            <div className="h-40 bg-muted rounded-2xl" />
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!ticket) {
    return (
      <ProtectedLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">Ticket not found</p>
          <p className="text-muted-foreground mb-6">This ticket doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate("/tickets")}>← Back to Tickets</Button>
        </div>
      </ProtectedLayout>
    );
  }

  const roadmap = (ticket.solution_roadmap as unknown) as RoadmapItem[] | null;
  const hasProposal = roadmap && roadmap.length > 0 && ticket.credit_cost;
  const statusMeta = STATUS_META[ticket.status] || STATUS_META["submitted"];
  const priorityMeta = PRIORITY_META[ticket.priority] || PRIORITY_META["medium"];
  const isUnderReview = ticket.status === "under_review";
  const isUAT = ticket.status === "uat";
  const isActive = ["in_progress", "approved", "under_review", "uat"].includes(ticket.status);
  const isClosed = ticket.status === "closed";
  const isCompleted = ticket.status === "completed";

  // Build timeline with durations
  const timelineWithDuration = events.map((ev, i) => {
    const next = events[i + 1];
    const durMins = next
      ? differenceInMinutes(new Date(next.created_at), new Date(ev.created_at))
      : differenceInMinutes(new Date(), new Date(ev.created_at));
    return { ...ev, durationMins: durMins };
  });

  // Stats for closed ticket
  const totalMins = events.length > 1
    ? differenceInMinutes(new Date(events[events.length - 1].created_at), new Date(events[0].created_at))
    : 0;

  const tabs = [
    { id: "overview", label: "Overview", icon: <Activity className="h-3.5 w-3.5" /> },
    ...(hasProposal ? [{ id: "proposal", label: "Proposal", icon: <Target className="h-3.5 w-3.5" /> }] : []),
    ...(events.length > 0 ? [{ id: "timeline", label: "Timeline", icon: <TrendingUp className="h-3.5 w-3.5" /> }] : []),
    ...(isActive || isClosed || isCompleted ? [{ id: "chat", label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" /> }] : []),
    ...(isClosed ? [{ id: "stats", label: "Stats", icon: <BarChart3 className="h-3.5 w-3.5" /> }] : []),
  ];

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-0">
        {/* Back nav + breadcrumb */}
        <div className="flex items-center gap-2 mb-5">
          <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")} className="gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">My Tickets</span>
          </Button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">{ticket.title}</span>
        </div>

        {/* ── HERO CARD ── */}
        <Card className="rounded-2xl border-border shadow-md mb-4 overflow-hidden">
          {/* Status ribbon */}
          <div className={`px-5 py-2.5 flex items-center gap-2 border-b ${statusMeta.bg}`}>
            <span className={statusMeta.color}>{statusMeta.icon}</span>
            <span className={`text-sm font-semibold ${statusMeta.color}`}>{statusMeta.label}</span>
            <span className="text-xs text-muted-foreground ml-1">— {statusMeta.desc}</span>
          </div>

          <CardContent className="p-5">
            {/* Title + meta row */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground leading-snug mb-2">{ticket.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priorityMeta.bg} ${priorityMeta.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta.dot}`} />
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                  </span>
                  {ticket.difficulty_level && (
                    <Badge variant="outline" className="text-xs capitalize">{ticket.difficulty_level}</Badge>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(ticket.created_at), "MMM d, yyyy · h:mm a")}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Stepper */}
            <ProgressStepper status={ticket.status} />

            {/* Proposal summary chips */}
            {hasProposal && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/15 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Timer className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Est. Time</p>
                    <p className="text-lg font-bold text-foreground leading-none">{ticket.estimated_hours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/15 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Coins className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Total Cost</p>
                    <p className="text-lg font-bold text-foreground leading-none">{ticket.credit_cost} cr</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── ACTION CARD: context-aware CTA (Hick's Law: only show what matters now) ── */}
        {isUnderReview && hasProposal && (
          <Card className="rounded-2xl border-warning/30 bg-warning/5 mb-4 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Action Required</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Review the proposal and approve to start work.</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Your Credits</p>
                  <p className="font-bold text-foreground">{profile?.credits ?? 0}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Required</p>
                  <p className="font-bold text-accent">{ticket.credit_cost}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">After</p>
                  <p className={`font-bold ${(profile?.credits ?? 0) >= (ticket.credit_cost ?? 0) ? "text-success" : "text-destructive"}`}>
                    {(profile?.credits ?? 0) - (ticket.credit_cost ?? 0)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button size="lg" onClick={handleProceed} className="flex-1 gap-2 rounded-xl h-12 text-base font-semibold">
                  <CheckCircle className="h-5 w-5" />
                  Approve & Pay {ticket.credit_cost} Credits
                </Button>
                <Button size="lg" variant="outline" onClick={handleCancel} className="gap-2 rounded-xl h-12 border-destructive/40 text-destructive hover:bg-destructive/5">
                  <XCircle className="h-4 w-4" />
                  Decline
                </Button>
              </div>
              <Link to="/pricing" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-3 w-fit">
                <Info className="h-3 w-3" /> How pricing works
              </Link>
            </CardContent>
          </Card>
        )}

        {/* ── UAT CARD ── */}
        {isUAT && (
          <Card className="rounded-2xl border-info/30 mb-4 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-info/8 border-b border-info/20 flex items-center gap-2">
              <Target className="h-4 w-4 text-info" />
              <span className="font-semibold text-info text-sm">Work Delivered — Your Review Required</span>
            </div>
            <CardContent className="p-5">
              {/* UAT Notes from admin */}
              {ticket.uat_notes && (
                <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes from Team</p>
                  <p className="text-sm text-foreground">{ticket.uat_notes}</p>
                </div>
              )}
              {/* UAT Attachments */}
              {ticket.uat_attachments && ticket.uat_attachments.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Deliverable Files</p>
                  <div className="space-y-2">
                    {ticket.uat_attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-3 bg-card rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground flex-1 truncate">{url.split("/").pop() || `File ${i + 1}`}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Review form — only if not yet submitted */}
              {!existingReview ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/40 rounded-xl border border-border">
                    <p className="text-sm font-semibold text-foreground mb-1">Rate our work</p>
                    <p className="text-xs text-muted-foreground mb-4">Your honest feedback helps us improve. All fields optional except Overall.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <StarRating value={review.overall} onChange={(v) => setReview(r => ({ ...r, overall: v }))} label="Overall Quality *" />
                      <StarRating value={review.timeliness} onChange={(v) => setReview(r => ({ ...r, timeliness: v }))} label="Timeliness" />
                      <StarRating value={review.value} onChange={(v) => setReview(r => ({ ...r, value: v }))} label="Value for Credits" />
                    </div>
                  </div>
                  <Textarea
                    placeholder="Share your experience — what went well, what could be better..."
                    value={review.comment}
                    onChange={(e) => setReview(r => ({ ...r, comment: e.target.value }))}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      onClick={() => submitReviewMutation.mutate()}
                      disabled={submitReviewMutation.isPending || review.overall === 0}
                      className="flex-1 gap-2 rounded-xl h-12 font-semibold"
                    >
                      <Award className="h-5 w-5" />
                      {submitReviewMutation.isPending ? "Submitting..." : "Confirm & Submit Review"}
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setActiveTab("chat")} className="gap-2 rounded-xl h-12">
                      <MessageSquare className="h-4 w-4" />
                      Need Help?
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-success/5 rounded-xl border border-success/20 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-success">Review Submitted</p>
                    <p className="text-xs text-muted-foreground">You rated {existingReview.rating_overall}/5 overall.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── CLOSED: Review summary ── */}
        {isClosed && existingReview && (
          <Card className="rounded-2xl border-success/20 bg-success/5 mb-4 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-success" />
                <p className="font-semibold text-success text-sm">Your Review</p>
              </div>
              <div className="flex gap-4 mb-2">
                {existingReview.rating_overall && (
                  <div className="text-center">
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= existingReview.rating_overall! ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Overall</p>
                  </div>
                )}
              </div>
              {existingReview.comment && <p className="text-sm text-foreground italic">"{existingReview.comment}"</p>}
            </CardContent>
          </Card>
        )}

        {/* ── TABS ── (Chunking / Miller's Law: group related info) */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-xl h-11 bg-muted/60 p-1 mb-4">
            {tabs.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="flex-1 rounded-lg gap-1.5 text-xs font-medium data-[state=active]:shadow-sm">
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            {/* Description */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Request Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: ticket.description }} />
              </CardContent>
            </Card>

            {/* Expert Opinion */}
            {ticket.expert_opinion && (
              <Card className="rounded-2xl border-primary/20 bg-primary/3">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Expert Opinion</p>
                      <p className="text-sm text-foreground">{ticket.expert_opinion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {ticket.file_urls && ticket.file_urls.length > 0 && (
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Attachments</p>
                  <div className="space-y-2">
                    {ticket.file_urls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="truncate flex-1">{url.split("/").pop()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* If submitted, show waiting message */}
            {ticket.status === "submitted" && (
              <Card className="rounded-2xl border-dashed border-muted-foreground/30">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">Awaiting Expert Review</p>
                  <p className="text-sm text-muted-foreground">Our team will review your request and prepare a proposal. We'll notify you when it's ready.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PROPOSAL TAB */}
          {hasProposal && (
            <TabsContent value="proposal" className="space-y-4 mt-0">
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Solution Roadmap</p>
                      <p className="text-sm text-muted-foreground">{roadmap!.length} phases · {ticket.estimated_hours}h estimated</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">{ticket.credit_cost}</p>
                      <p className="text-xs text-muted-foreground">credits total</p>
                    </div>
                  </div>

                  {/* Roadmap timeline */}
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {roadmap!.map((item, i) => (
                        <div key={i} className="relative pl-12">
                          <div className="absolute left-3 top-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary-foreground">{i + 1}</span>
                          </div>
                          <div className="p-4 bg-muted/40 rounded-xl border border-border hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                Hour {item.hour}
                              </Badge>
                              <span className="text-sm font-semibold text-foreground">{item.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            {item.subtasks && item.subtasks.length > 0 && (
                              <div className="mt-2 pl-3 border-l-2 border-primary/20 space-y-1">
                                {item.subtasks.map((sub, si) => (
                                  <div key={si} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle className="h-3 w-3 text-primary/50 flex-shrink-0" />
                                    <span>{sub.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* TIMELINE TAB */}
          {events.length > 0 && (
            <TabsContent value="timeline" className="mt-0">
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-5">Activity Timeline</p>
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {timelineWithDuration.map((ev, i) => {
                        const toMeta = STATUS_META[ev.to_status] || { color: "text-muted-foreground", bg: "bg-muted", label: ev.to_status, icon: <Activity className="h-3 w-3" /> };
                        const isLast = i === timelineWithDuration.length - 1;
                        return (
                          <div key={ev.id} className="relative pl-12">
                            <div className={`absolute left-2.5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${isLast ? "bg-primary" : "bg-muted border-2 border-border"}`}>
                              <span className={isLast ? "text-primary-foreground" : "text-muted-foreground"}>
                                {toMeta.icon}
                              </span>
                            </div>
                            <div className="pb-4">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <span className={`text-xs font-semibold ${toMeta.color}`}>{toMeta.label}</span>
                                  {ev.from_status && (
                                    <span className="text-xs text-muted-foreground"> ← {STATUS_META[ev.from_status]?.label || ev.from_status}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                  {format(new Date(ev.created_at), "MMM d · h:mm a")}
                                </span>
                              </div>
                              {ev.note && (
                                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border border-border mt-1">{ev.note}</p>
                              )}
                              {ev.attachments && ev.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {ev.attachments.map((url, ai) => (
                                    <a key={ai} href={url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-primary/5 text-primary rounded-md border border-primary/20 hover:bg-primary/10 transition-colors">
                                      <FileText className="h-2.5 w-2.5" /> {url.split("/").pop()?.slice(0, 20)}
                                    </a>
                                  ))}
                                </div>
                              )}
                              {!isLast && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <Clock className="h-3 w-3 text-muted-foreground/50" />
                                  <span className="text-[10px] text-muted-foreground/60">{formatDuration(ev.durationMins)} in this stage</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* CHAT TAB */}
          {(isActive || isClosed || isCompleted) && (
            <TabsContent value="chat" className="mt-0">
              {user && <TicketChat ticketId={ticket.id} />}
            </TabsContent>
          )}

          {/* STATS TAB — for closed tickets */}
          {isClosed && (
            <TabsContent value="stats" className="mt-0 space-y-4">
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Lifecycle Summary</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-center">
                      <p className="text-2xl font-bold text-primary">{ticket.estimated_hours ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Est. Hours</p>
                    </div>
                    <div className="p-3 bg-accent/5 border border-accent/15 rounded-xl text-center">
                      <p className="text-2xl font-bold text-accent">{ticket.credit_cost ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Credits Used</p>
                    </div>
                    <div className="p-3 bg-success/5 border border-success/15 rounded-xl text-center col-span-2 sm:col-span-1">
                      <p className="text-2xl font-bold text-success">{formatDuration(totalMins)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Total Duration</p>
                    </div>
                  </div>
                  {/* Stage breakdown */}
                  <div className="space-y-2">
                    {timelineWithDuration.map((ev, i) => {
                      const pct = totalMins > 0 ? Math.round((ev.durationMins / totalMins) * 100) : 0;
                      const toMeta = STATUS_META[ev.to_status] || { label: ev.to_status, color: "text-muted-foreground" };
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-medium ${toMeta.color}`}>{toMeta.label}</span>
                            <span className="text-muted-foreground">{formatDuration(ev.durationMins)} · {pct}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              {/* Review on stats */}
              {existingReview && (
                <Card className="rounded-2xl border-success/20">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Review</p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { label: "Overall", val: existingReview.rating_overall },
                        { label: "Timeliness", val: existingReview.rating_timeliness },
                        { label: "Value", val: existingReview.rating_value },
                      ].map(({ label, val }) => val && (
                        <div key={label} className="text-center p-2 bg-muted/50 rounded-xl">
                          <div className="flex justify-center gap-0.5 mb-1">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= val ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />)}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                    {existingReview.comment && <p className="text-sm text-foreground italic bg-muted/40 p-3 rounded-lg">"{existingReview.comment}"</p>}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ProtectedLayout>
  );
}
