import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import PathTracker from "@/components/PathTracker";
import TimelineView from "@/components/TimelineView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";

type Ticket = Tables<"tickets">;

interface RoadmapItem {
  hour: number;
  title: string;
  description: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-accent/10 text-accent",
  critical: "bg-destructive/10 text-destructive",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshProfile } = useAuth();
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

  const roadmap = ticket.solution_roadmap as RoadmapItem[] | null;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </Button>

        <Card className="mb-5">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className={`status-badge ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <span className="text-xs text-muted-foreground">
                Created {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <CardTitle>{ticket.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <PathTracker status={ticket.status} />

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

        {roadmap && roadmap.length > 0 && (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Solution Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineView roadmap={roadmap} />
              {ticket.credit_cost && (
                <div className="mt-5 p-4 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Cost</p>
                    <p className="text-2xl font-bold text-accent">{ticket.credit_cost} credits</p>
                    <p className="text-xs text-muted-foreground">{ticket.estimated_hours} business hours</p>
                  </div>
                  {ticket.status === "approved" && (
                    <Button size="lg" onClick={handleProceed} className="gap-2 shadow-primary">
                      Proceed & Start Work
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  );
}
