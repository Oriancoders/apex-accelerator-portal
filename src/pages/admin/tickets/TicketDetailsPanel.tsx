import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Coins,
  FileText,
  MessageSquare,
  Star,
  Target,
  Timer,
  TrendingUp,
  UserRound,
  Workflow,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { sanitizeTicketHtml } from "@/lib/sanitize";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProposalBuilder from "@/components/ProposalBuilder";
import TicketChat from "@/components/TicketChat";
import ProgressStepper from "@/shared/ProgressStepper";
import TicketTimeline from "@/shared/TicketTimeline";
import LifecycleStats from "@/shared/LifecycleStats";
import StatusBadge from "@/shared/StatusBadge";
import { PRIORITY_META, STATUS_ACTION, STATUS_META } from "@/constants/ticket";
import type { ProposalStep } from "@/components/proposal-builder/types";
import UATPanel from "@/pages/admin/tickets/UATPanel";
import { ALL_STATUSES, type RoadmapItem, type TicketEvent, type TicketStatus, type TicketType } from "@/pages/admin/tickets/types";

type TicketDetailsPanelProps = {
  ticket: TicketType;
  onClose?: () => void;
  onRefresh: () => void;
};

const STATUS_DEFAULT_TAB: Partial<Record<TicketStatus, string>> = {
  submitted: "proposal",
  under_review: "proposal",
  approved: "proposal",
  in_progress: "uat",
  uat: "uat",
  completed: "stats",
  cancelled: "details",
};

const NEXT_RECOMMENDED_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  approved: "in_progress",
  in_progress: "uat",
  uat: "completed",
};

const COMPLEXITY_ORDER: Array<"easy" | "medium" | "hard" | "expert"> = ["easy", "medium", "hard", "expert"];

const complexityByPosition = (index: number, total: number): "easy" | "medium" | "hard" | "expert" => {
  if (total <= 1) return "easy";
  const scaled = Math.round((index / (total - 1)) * (COMPLEXITY_ORDER.length - 1));
  return COMPLEXITY_ORDER[Math.max(0, Math.min(scaled, COMPLEXITY_ORDER.length - 1))];
};

export default function TicketDetailsPanel({ ticket, onClose, onRefresh }: TicketDetailsPanelProps) {
  const queryClient = useQueryClient();
  const [detailsTab, setDetailsTab] = useState<string>(STATUS_DEFAULT_TAB[ticket.status] || "details");
  const [focusFilter, setFocusFilter] = useState<"identity" | "process">(ticket.status === "submitted" ? "process" : "identity");
  const [showAllStatusOptions, setShowAllStatusOptions] = useState(false);

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
      const { data } = await supabase
        .from("ticket_reviews")
        .select("*")
        .eq("ticket_id", ticket.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: requesterProfile } = useQuery({
    queryKey: ["admin-ticket-requester", ticket.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name,email,phone,company")
        .eq("user_id", ticket.user_id)
        .maybeSingle();
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
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const submitProposalMutation = useMutation({
    mutationFn: async ({
      steps,
      estimatedHours,
      creditCost,
      expertOpinion,
      difficultyLevel,
      category,
    }: {
      steps: RoadmapItem[];
      estimatedHours: number;
      creditCost: number;
      expertOpinion: string;
      difficultyLevel: "easy" | "medium" | "hard" | "expert";
      category: "general" | "salesforce";
    }) => {
      const { error } = await supabase
        .from("tickets")
        .update({
          solution_roadmap: steps as unknown as TicketType["solution_roadmap"],
          estimated_hours: estimatedHours,
          credit_cost: creditCost,
          expert_opinion: expertOpinion,
          difficulty_level: difficultyLevel as TicketType["difficulty_level"],
          category,
          status: "under_review" as TicketStatus,
        })
        .eq("id", ticket.id);
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
      onClose?.();
    },
    onError: () => toast.error("Operation failed. Please try again."),
  });

  const roadmap = ticket.solution_roadmap as unknown as RoadmapItem[] | null;
  const proposalInitialSteps: ProposalStep[] | undefined = roadmap?.map((item, i, all) => ({
    hour: item.hour,
    title: item.title,
    description: item.description,
    complexity: item.complexity || complexityByPosition(i, all.length),
    subtasks: [],
  }));
  const hasProposal = roadmap && roadmap.length > 0 && ticket.credit_cost;
  const action = STATUS_ACTION[ticket.status];
  const statusMeta = STATUS_META[ticket.status] || STATUS_META.submitted;
  const priorityMeta = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
  const recommendedStatus = NEXT_RECOMMENDED_STATUS[ticket.status];

  const tabs = [
    { id: "details", label: "Details", icon: <FileText className="h-3.5 w-3.5" /> },
    { id: "proposal", label: "Proposal", icon: <Zap className="h-3.5 w-3.5" /> },
    ...(["in_progress", "approved", "uat"].includes(ticket.status)
      ? [{ id: "uat", label: "UAT", icon: <Target className="h-3.5 w-3.5" /> }]
      : []),
    { id: "timeline", label: "Timeline", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: "chat", label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    ...(ticket.status === "completed" ? [{ id: "stats", label: "Stats", icon: <BarChart3 className="h-3.5 w-3.5" /> }] : []),
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (focusFilter === "identity") return ["details", "chat"].includes(tab.id);
    return ["proposal", "uat", "timeline", "stats"].includes(tab.id);
  });

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === detailsTab)) {
      setDetailsTab(visibleTabs[0]?.id || "details");
    }
  }, [detailsTab, visibleTabs]);

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden flex flex-col">

      <div className={`px-6 py-4 border-b ${statusMeta.bg} ${statusMeta.border} border-b`}>
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={ticket.status} />
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${priorityMeta.bg} ${priorityMeta.color}`}>
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
        <div className="mt-3">
          <ProgressStepper status={ticket.status} />
        </div>
      </div>

      <div className="px-6 py-3 border-b border-border bg-background/95">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={focusFilter === "identity" ? "default" : "outline"}
            className="h-10 rounded-xl justify-start gap-2"
            onClick={() => {
              setFocusFilter("identity");
              setDetailsTab("details");
            }}
          >
            <UserRound className="h-4 w-4" />
            User and Company
          </Button>
          <Button
            variant={focusFilter === "process" ? "default" : "outline"}
            className="h-10 rounded-xl justify-start gap-2"
            onClick={() => {
              setFocusFilter("process");
              setDetailsTab(STATUS_DEFAULT_TAB[ticket.status] || "proposal");
            }}
          >
            <Workflow className="h-4 w-4" />
            Process
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Focused view to reduce decision load: choose identity context or workflow context.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs value={detailsTab} onValueChange={setDetailsTab} className="h-full flex flex-col">
          <div className="px-6 pt-3 border-b border-border">
            <TabsList className="h-9 bg-transparent p-0 gap-0 border-none rounded-none">
              {visibleTabs.map((tab) => (
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

          <TabsContent value="details" className="flex-1 p-6 space-y-5 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5" /> Requester
                </p>
                <p className="text-sm font-semibold text-foreground">{requesterProfile?.full_name || "Unknown user"}</p>
                <p className="text-xs text-muted-foreground">{requesterProfile?.email || ticket.contact_email || "No email"}</p>
                <p className="text-xs text-muted-foreground">{requesterProfile?.phone || ticket.contact_phone || "No phone"}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Company
                </p>
                <p className="text-sm font-semibold text-foreground">{requesterProfile?.company || "No company provided"}</p>
                <p className="text-xs text-muted-foreground">Company profile is shown when available from requester data.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Status</p>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Priority</p>
                <span className={`text-sm font-semibold capitalize ${priorityMeta.color}`}>{ticket.priority}</span>
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

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <div
                className="prose prose-sm max-w-none bg-muted/30 p-4 rounded-xl border border-border text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeTicketHtml(ticket.description) }}
              />
            </div>

            {ticket.expert_opinion && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expert Opinion</p>
                <p className="text-sm text-foreground bg-primary/5 border border-primary/15 p-4 rounded-xl leading-relaxed">
                  {ticket.expert_opinion}
                </p>
              </div>
            )}

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
                  ].map(({ label, val }) =>
                    val != null ? (
                      <div key={label} className="text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                        <div className="flex justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= val ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
                {ticketReview.comment && (
                  <p className="text-xs text-foreground bg-background/60 p-3 rounded-lg border border-border italic">
                    "{ticketReview.comment}"
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
              {recommendedStatus ? (
                <Button
                  className="h-10 rounded-xl text-sm"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate({ status: recommendedStatus })}
                >
                  Move to {STATUS_META[recommendedStatus]?.label || recommendedStatus}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">No suggested status transition at this stage.</p>
              )}

              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setShowAllStatusOptions((prev) => !prev)}
                >
                  {showAllStatusOptions ? "Hide advanced status controls" : "Show advanced status controls"}
                </Button>

                {showAllStatusOptions && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {ALL_STATUSES.map((status) => (
                      <Button
                        key={status}
                        variant={ticket.status === status ? "default" : "outline"}
                        size="sm"
                        className="rounded-lg h-8 text-xs"
                        disabled={ticket.status === status || updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ status })}
                      >
                        {STATUS_META[status]?.label || status}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proposal" className="p-6 mt-0">
            {ticket.status === "submitted" ? (
              <ProposalBuilder
                priority={ticket.priority}
                initialCategory={((ticket as unknown as { category?: "general" | "salesforce" }).category as "general" | "salesforce") || "general"}
                initialSteps={proposalInitialSteps}
                initialHours={ticket.estimated_hours || undefined}
                initialCost={ticket.credit_cost || undefined}
                initialOpinion={ticket.expert_opinion || ""}
                initialDifficulty={ticket.difficulty_level || undefined}
                loading={submitProposalMutation.isPending}
                onSubmit={(data) =>
                  submitProposalMutation.mutate({
                    category: data.category,
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
                    <p className="text-lg font-bold">{ticket.difficulty_level || "—"}</p>
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
                      {roadmap.map((item, i) => {
                        const complexity = item.complexity || complexityByPosition(i, roadmap.length);
                        const complexityTone =
                          complexity === "easy"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : complexity === "medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : complexity === "hard"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-rose-50 text-rose-700 border-rose-200";

                        return (
                          <div key={i} className="relative pl-10 pb-4">
                            <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                              <span className="text-[9px] font-bold text-primary">{i + 1}</span>
                            </div>
                            <div className="p-3 bg-muted/40 rounded-xl border border-border">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-primary">Hour {item.hour}</span>
                                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${complexityTone}`}>
                                  {complexity}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {ticket.status === "under_review" && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-3">Proposal is awaiting client approval. You can edit below:</p>
                    <ProposalBuilder
                      priority={ticket.priority}
                      initialCategory={((ticket as unknown as { category?: "general" | "salesforce" }).category as "general" | "salesforce") || "general"}
                      initialSteps={proposalInitialSteps}
                      initialHours={ticket.estimated_hours || undefined}
                      initialCost={ticket.credit_cost || undefined}
                      initialOpinion={ticket.expert_opinion || ""}
                      initialDifficulty={ticket.difficulty_level || undefined}
                      loading={submitProposalMutation.isPending}
                      onSubmit={(data) =>
                        submitProposalMutation.mutate({
                          category: data.category,
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

          <TabsContent value="timeline" className="p-6 mt-0">
            <TicketTimeline events={events} />
          </TabsContent>

          <TabsContent value="chat" className="p-6 mt-0">
            <TicketChat ticketId={ticket.id} isAdmin />
          </TabsContent>

          <TabsContent value="stats" className="p-6 mt-0">
            <LifecycleStats events={events} ticket={ticket} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
