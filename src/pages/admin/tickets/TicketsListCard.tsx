import { format } from "date-fns";
import { AlertCircle, Eye, Filter, Search, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALL_STATUSES, type TicketType } from "@/pages/admin/tickets/types";
import { PRIORITY_META, STATUS_ACTION, STATUS_META } from "@/constants/ticket";
import StatusBadge from "@/shared/StatusBadge";

type TicketsListCardProps = {
  search: string;
  statusFilter: string;
  isLoading: boolean;
  tickets: TicketType[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onOpenTicket: (ticket: TicketType) => void;
};

export default function TicketsListCard({
  search,
  statusFilter,
  isLoading,
  tickets,
  onSearchChange,
  onStatusFilterChange,
  onOpenTicket,
}: TicketsListCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_META[status]?.label || status}
                </SelectItem>
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
                  {tickets.map((ticket) => {
                    const action = STATUS_ACTION[ticket.status];
                    return (
                      <TableRow
                        key={ticket.id}
                        className="group cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => onOpenTicket(ticket)}
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
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(ticket.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {tickets.length === 0 && (
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

            <div className="sm:hidden space-y-2 px-4">
              {tickets.map((ticket) => {
                const action = STATUS_ACTION[ticket.status];
                return (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl border border-border hover:bg-muted/40 transition-colors cursor-pointer active:scale-[0.99]"
                    onClick={() => onOpenTicket(ticket)}
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
                      {ticket.credit_cost && <span className="text-[11px] font-bold text-accent">{ticket.credit_cost} cr</span>}
                      {action?.urgent && (
                        <span className="text-[11px] font-semibold text-destructive flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> Action needed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {tickets.length === 0 && (
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
  );
}
