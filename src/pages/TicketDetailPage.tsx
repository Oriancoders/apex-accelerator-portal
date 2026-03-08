import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import PathTracker from "@/components/PathTracker";
import TimelineView from "@/components/TimelineView";
import TicketChat from "@/components/TicketChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, Coins, Timer, Info } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"tickets">;

interface SubTask {
  title: string;
}

interface RoadmapItem {
  hour: number;
  title: string;
  description: string;
  subtasks?: SubTask[];
}

const priorityColors: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-accent/10 text-accent",
  critical: "bg-destructive/10 text-destructive",
};

const difficultyLabels: Record<string, string> = {
  easy: "🟢 Easy",
  medium: "🟡 Medium",
  hard: "🟠 Hard",
  expert: "🔴 Expert",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const { data: ticket, isLoading, refetch } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("tickets").select("*").eq("id", id).single();
      return data as Ticket | null;
    },
    enabled: !!id,
  });

  const handleProceed = async () => {
    if (!ticket || !user) return;
    if (!ticket.credit_cost) {
      toast.error("No credit cost assigned to this ticket yet.");
      return;
    }

    const currentCredits = profile?.credits ?? 0;
    if (currentCredits < ticket.credit_cost) {
      toast.error(`Insufficient credits (${currentCredits}/${ticket.credit_cost}). Purchase more credits first.`);
      navigate("/credits");
      return;
    }

    const { data, error } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: ticket.credit_cost,
      p_ticket_id: ticket.id,
      p_description: `Service: ${ticket.title}`,
    });

    if (error) {
      toast.error("Failed to process: " + error.message);
    } else if (data === false) {
      toast.error("Insufficient credits. Please purchase more credits.");
      navigate("/credits");
    } else {
      toast.success("Credits deducted! Work is now in progress.");
      await refreshProfile();
      refetch();
    }
  };

  const handleCancel = async () => {
    if (!ticket) return;
    const { error } = await supabase.from("tickets").update({ status: "cancelled" }).eq("id", ticket.id);
    if (error) {
      toast.error("Failed to cancel: " + error.message);
    } else {
      toast.success("Ticket cancelled.");
      refetch();
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-muted-foreground">Loading ticket...</div>
      </ProtectedLayout>
    );
  }

  if (!ticket) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ticket not found.</p>
          <Button onClick={() => navigate("/tickets")}>Back to Tickets</Button>
        </div>
      </ProtectedLayout>
    );
  }

  const roadmap = (ticket.solution_roadmap as unknown) as RoadmapItem[] | null;
  const hasProposal = roadmap && roadmap.length > 0 && ticket.credit_cost;
  const isUnderReview = ticket.status === "under_review";
  const isActive = ["in_progress", "approved", "under_review", "uat"].includes(ticket.status);

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </Button>

        <Card className="mb-5">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className={`status-badge ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
              {ticket.difficulty_level && (
                <Badge variant="outline" className="text-xs">
                  {difficultyLabels[ticket.difficulty_level] || ticket.difficulty_level}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Created {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <CardTitle>{ticket.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <PathTracker status={ticket.status} />

            {/* Summary bar: Total Hours + Total Credits */}
            {hasProposal && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Timer className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Time</p>
                    <p className="text-lg font-bold text-foreground">{ticket.estimated_hours} hour{ticket.estimated_hours !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <Coins className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-bold text-foreground">{ticket.credit_cost} credits</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: ticket.description }} />

            {ticket.file_urls && ticket.file_urls.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Attachments</h4>
                <div className="space-y-1">
                  {ticket.file_urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{url.split("/").pop()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {ticket.expert_opinion && (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-base">Expert Opinion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{ticket.expert_opinion}</p>
            </CardContent>
          </Card>
        )}

        {/* Proposal Timeline with subtasks */}
        {hasProposal && (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Solution Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineView roadmap={roadmap!} />
              <div className="mt-5 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Cost</p>
                    <p className="text-2xl font-bold text-accent">{ticket.credit_cost} credits</p>
                    <p className="text-xs text-muted-foreground">{ticket.estimated_hours} business hours</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Your balance: <span className="font-semibold text-foreground">{profile?.credits ?? 0} credits</span></p>
                    <Link to="/pricing" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3" /> How pricing works
                    </Link>
                  </div>
                </div>

                {/* Proceed / Cancel buttons for under_review status */}
                {isUnderReview && (
                  <div className="flex gap-3 mt-3">
                    <Button size="lg" onClick={handleProceed} className="flex-1 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Proceed & Pay {ticket.credit_cost} Credits
                    </Button>
                    <Button size="lg" variant="destructive" onClick={handleCancel} className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat for active tickets */}
        {isActive && user && (
          <div className="mb-5">
            <TicketChat ticketId={ticket.id} />
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
