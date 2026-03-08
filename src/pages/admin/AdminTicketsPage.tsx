import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import PathTracker from "@/components/PathTracker";
import ProposalBuilder from "@/components/ProposalBuilder";
import TicketChat from "@/components/TicketChat";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Eye, Send, Ticket, Filter } from "lucide-react";
import type { Tables, Database } from "@/integrations/supabase/types";

type TicketType = Tables<"tickets">;
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const statusColors: Record<string, string> = {
  submitted: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  under_review: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
  approved: "bg-primary/10 text-primary",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  cancelled: "bg-destructive/10 text-destructive",
};

const priorityColors: Record<string, string> = {
  low: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  medium: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  high: "bg-accent/10 text-accent",
  critical: "bg-destructive/10 text-destructive",
};

interface RoadmapItem {
  hour: number;
  title: string;
  description: string;
}

export default function AdminTicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [dialogTab, setDialogTab] = useState<string>("details");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as TicketType[];
    },
  });

  const submitProposalMutation = useMutation({
    mutationFn: async ({ id, steps, estimatedHours, creditCost, expertOpinion }: {
      id: string; steps: RoadmapItem[]; estimatedHours: number; creditCost: number; expertOpinion: string;
    }) => {
      const { error } = await supabase.from("tickets").update({
        solution_roadmap: steps as any,
        estimated_hours: estimatedHours,
        credit_cost: creditCost,
        expert_opinion: expertOpinion,
        status: "under_review" as TicketStatus,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposal submitted! Ticket moved to Under Review.");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      setSelectedTicket(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) => {
      const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = tickets.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Manage Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">{tickets.length} total tickets</p>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="px-4 sm:px-6">
            {/* Responsive filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((ticket) => (
                        <TableRow key={ticket.id} className="group">
                          <TableCell className="font-medium max-w-[200px] truncate">{ticket.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{ticket.credit_cost ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(ticket.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedTicket(ticket); setDialogTab("details"); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedTicket(ticket); setDialogTab("proposal"); }}>
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No tickets found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card list — Fitts's Law: large touch targets */}
                <div className="sm:hidden space-y-2 px-4">
                  {filtered.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedTicket(ticket); setDialogTab("details"); }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground line-clamp-2 flex-1">{ticket.title}</p>
                        <Badge variant="outline" className={`${statusColors[ticket.status]} text-[10px] flex-shrink-0`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={`${priorityColors[ticket.priority]} text-[10px]`}>{ticket.priority}</Badge>
                        <span>{format(new Date(ticket.created_at), "MMM d")}</span>
                        {ticket.credit_cost && <span className="font-semibold text-accent">{ticket.credit_cost} cr</span>}
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No tickets found
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Dialog — responsive max-width */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl mx-4 sm:mx-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg pr-6">{selectedTicket.title}</DialogTitle>
              </DialogHeader>
              <Tabs value={dialogTab} onValueChange={setDialogTab}>
                <TabsList className="grid w-full grid-cols-3 rounded-xl">
                  <TabsTrigger value="details" className="rounded-lg text-xs sm:text-sm">Details</TabsTrigger>
                  <TabsTrigger value="proposal" className="rounded-lg text-xs sm:text-sm">Proposal</TabsTrigger>
                  <TabsTrigger value="chat" className="rounded-lg text-xs sm:text-sm">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <PathTracker status={selectedTicket.status} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className={statusColors[selectedTicket.status]}>{selectedTicket.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedTicket.contact_email || "—"}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <span className="text-muted-foreground">Credits:</span> <span className="font-bold text-accent">{selectedTicket.credit_cost ?? "—"}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Description</h4>
                    <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-xl text-sm" dangerouslySetInnerHTML={{ __html: selectedTicket.description }} />
                  </div>
                  {selectedTicket.expert_opinion && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Expert Opinion</h4>
                      <p className="text-sm text-foreground bg-muted/50 p-4 rounded-xl">{selectedTicket.expert_opinion}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Quick Status Update</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(["submitted", "under_review", "approved", "in_progress", "completed", "cancelled"] as TicketStatus[]).map((s) => (
                        <Button
                          key={s}
                          variant={selectedTicket.status === s ? "default" : "outline"}
                          size="sm"
                          className="rounded-lg h-9 text-xs sm:text-sm"
                          disabled={selectedTicket.status === s}
                          onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: s })}
                        >
                          {s.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="proposal" className="mt-4">
                  <ProposalBuilder
                    initialSteps={(selectedTicket.solution_roadmap as unknown as RoadmapItem[]) || undefined}
                    initialHours={selectedTicket.estimated_hours || undefined}
                    initialCost={selectedTicket.credit_cost || undefined}
                    initialOpinion={selectedTicket.expert_opinion || ""}
                    loading={submitProposalMutation.isPending}
                    onSubmit={(data) =>
                      submitProposalMutation.mutate({
                        id: selectedTicket.id,
                        steps: data.steps,
                        estimatedHours: data.estimatedHours,
                        creditCost: data.creditCost,
                        expertOpinion: data.expertOpinion,
                      })
                    }
                  />
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                  <TicketChat ticketId={selectedTicket.id} isAdmin />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
