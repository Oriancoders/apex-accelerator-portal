import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import PathTracker from "@/components/PathTracker";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Eye, Edit } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Tables<"tickets">;
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const statusColors: Record<string, string> = {
  submitted: "bg-warning/10 text-warning",
  under_review: "bg-info/10 text-info",
  approved: "bg-primary/10 text-primary",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const priorityColors: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState<TicketStatus>("submitted");
  const [editExpertOpinion, setEditExpertOpinion] = useState("");
  const [editCreditCost, setEditCreditCost] = useState("");
  const [editEstimatedHours, setEditEstimatedHours] = useState("");
  const [editRoadmap, setEditRoadmap] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as Ticket[];
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (updates: {
      id: string;
      status?: TicketStatus;
      expert_opinion?: string;
      credit_cost?: number;
      estimated_hours?: number;
      solution_roadmap?: unknown;
    }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from("tickets").update(rest as any).eq("id", id);
      if (error) throw error;

      // Add internal note if provided
      if (internalNote.trim()) {
        await supabase.from("ticket_updates").insert({
          ticket_id: id,
          message: internalNote,
          is_internal: true,
        });
      }
    },
    onSuccess: () => {
      toast.success("Ticket updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      setEditMode(false);
      setSelectedTicket(null);
      setInternalNote("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditExpertOpinion(ticket.expert_opinion || "");
    setEditCreditCost(ticket.credit_cost?.toString() || "");
    setEditEstimatedHours(ticket.estimated_hours?.toString() || "");
    const roadmap = ticket.solution_roadmap as unknown as RoadmapItem[] | null;
    setEditRoadmap(roadmap ? JSON.stringify(roadmap, null, 2) : "");
    setInternalNote("");
    setEditMode(true);
  };

  const handleSave = () => {
    if (!selectedTicket) return;
    let parsedRoadmap: RoadmapItem[] | undefined;
    if (editRoadmap.trim()) {
      try {
        parsedRoadmap = JSON.parse(editRoadmap);
      } catch {
        toast.error("Invalid JSON for roadmap");
        return;
      }
    }
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      status: editStatus,
      expert_opinion: editExpertOpinion || undefined,
      credit_cost: editCreditCost ? parseInt(editCreditCost) : undefined,
      estimated_hours: editEstimatedHours ? parseInt(editEstimatedHours) : undefined,
      solution_roadmap: parsedRoadmap,
    });
  };

  const filtered = tickets.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Tickets</h1>
        <p className="text-muted-foreground text-sm">{tickets.length} total tickets</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
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
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[ticket.status]}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.credit_cost ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setEditMode(false);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ticket)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View / Edit Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
            setEditMode(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && !editMode && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <PathTracker status={selectedTicket.status} />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Priority:</span>{" "}
                    <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge variant="outline" className={statusColors[selectedTicket.status]}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {selectedTicket.contact_email || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    {selectedTicket.contact_phone || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credit Cost:</span>{" "}
                    {selectedTicket.credit_cost ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Hours:</span>{" "}
                    {selectedTicket.estimated_hours ?? "—"}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <div
                    className="prose prose-sm max-w-none bg-muted p-3 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedTicket.description }}
                  />
                </div>
                {selectedTicket.expert_opinion && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Expert Opinion</h4>
                    <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                      {selectedTicket.expert_opinion}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Close
                </Button>
                <Button onClick={() => openEdit(selectedTicket)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </DialogFooter>
            </>
          )}

          {selectedTicket && editMode && (
            <>
              <DialogHeader>
                <DialogTitle>Edit: {selectedTicket.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TicketStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expert Opinion</Label>
                  <Textarea
                    value={editExpertOpinion}
                    onChange={(e) => setEditExpertOpinion(e.target.value)}
                    placeholder="Your expert assessment of this request..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Credit Cost</Label>
                    <Input
                      type="number"
                      value={editCreditCost}
                      onChange={(e) => setEditCreditCost(e.target.value)}
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div>
                    <Label>Estimated Hours</Label>
                    <Input
                      type="number"
                      value={editEstimatedHours}
                      onChange={(e) => setEditEstimatedHours(e.target.value)}
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Solution Roadmap (JSON)</Label>
                  <Textarea
                    value={editRoadmap}
                    onChange={(e) => setEditRoadmap(e.target.value)}
                    placeholder={`[\n  { "hour": 1, "title": "Requirements Analysis", "description": "..." },\n  { "hour": 2, "title": "Implementation", "description": "..." }\n]`}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label>Internal Note (optional)</Label>
                  <Textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Add an internal team note..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateTicketMutation.isPending}>
                  {updateTicketMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
