import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProtectedLayout from "@/components/ProtectedLayout";
import PathTracker from "@/components/PathTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"tickets">;

const priorityColors: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-accent/10 text-accent",
  critical: "bg-destructive/10 text-destructive",
};

export default function TicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    enabled: !!user,
  });

  return (
    <ProtectedLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tickets</h1>
          <p className="text-muted-foreground text-sm">{tickets.length} total requests</p>
        </div>
        <Button onClick={() => navigate("/tickets/new")} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No tickets yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Submit your first service request to get started.</p>
            <Button onClick={() => navigate("/tickets/new")} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`status-badge ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{ticket.title}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                <PathTracker status={ticket.status} />
                {ticket.credit_cost && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Cost: <span className="font-semibold text-accent">{ticket.credit_cost} credits</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
}
