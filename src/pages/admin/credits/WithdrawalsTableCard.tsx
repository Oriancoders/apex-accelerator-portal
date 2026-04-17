import { format } from "date-fns";
import { Filter, Search, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import type { WithdrawalProfile, WithdrawalRequest } from "@/pages/admin/credits/types";

type WithdrawalsTableCardProps = {
  search: string;
  statusFilter: string;
  isLoading: boolean;
  requests: WithdrawalRequest[];
  profileByUserId: Record<string, WithdrawalProfile>;
  adminNoteById: Record<string, string>;
  payoutRefById: Record<string, string>;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onAdminNoteChange: (id: string, value: string) => void;
  onPayoutRefChange: (id: string, value: string) => void;
  onApprove: (id: string, adminNotes?: string) => void;
  onReject: (id: string, adminNotes?: string) => void;
  onMarkPaid: (id: string, adminNotes?: string, payoutReference?: string) => void;
};

export default function WithdrawalsTableCard({
  search,
  statusFilter,
  isLoading,
  requests,
  profileByUserId,
  adminNoteById,
  payoutRefById,
  onSearchChange,
  onStatusFilterChange,
  onAdminNoteChange,
  onPayoutRefChange,
  onApprove,
  onReject,
  onMarkPaid,
}: WithdrawalsTableCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name, email or user ID..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading withdrawal requests...</div>
        ) : (
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Account Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const profile = profileByUserId[request.user_id];
                  const canApprove = request.status === "pending";
                  const canPay = request.status === "pending" || request.status === "approved";
                  const canReject = request.status === "pending" || request.status === "approved";

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{profile?.full_name || "Unknown user"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email || request.user_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{request.requested_credits}</TableCell>
                      <TableCell className="capitalize">{request.payment_method.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{request.account_details}</p>
                        {request.requester_note && (
                          <p className="text-xs text-muted-foreground mt-1">Note: {request.requester_note}</p>
                        )}
                        {request.admin_notes && (
                          <p className="text-xs text-muted-foreground mt-1">Admin: {request.admin_notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-2">
                          {(canApprove || canPay || canReject) && (
                            <>
                              <Input
                                placeholder="Admin note"
                                className="h-8 rounded-lg w-52"
                                value={adminNoteById[request.id] || ""}
                                onChange={(e) => onAdminNoteChange(request.id, e.target.value)}
                              />
                              <Input
                                placeholder="Payout reference"
                                className="h-8 rounded-lg w-52"
                                value={payoutRefById[request.id] || ""}
                                onChange={(e) => onPayoutRefChange(request.id, e.target.value)}
                              />
                            </>
                          )}
                          <div className="flex items-center gap-2">
                            {canApprove && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg"
                                onClick={() => onApprove(request.id, adminNoteById[request.id])}
                              >
                                Approve
                              </Button>
                            )}
                            {canReject && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-destructive"
                                onClick={() => onReject(request.id, adminNoteById[request.id])}
                              >
                                Reject
                              </Button>
                            )}
                            {canPay && (
                              <Button
                                size="sm"
                                className="rounded-lg"
                                onClick={() => onMarkPaid(request.id, adminNoteById[request.id], payoutRefById[request.id])}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No withdrawal requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
