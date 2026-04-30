import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgentRow, AssignmentLite, CompanyLite } from "@/pages/admin/agents/types";

type ManageAgentCompaniesDialogProps = {
  open: boolean;
  manageAgent: AgentRow | null;
  assignCompanyId: string;
  assignCommissionPercent: string;
  assignableCompanies: CompanyLite[];
  assignments: AssignmentLite[];
  commissionDraftByAssignment: Record<string, string>;
  createAssignmentPending: boolean;
  updateAssignmentStatusPending: boolean;
  updateAssignmentCommissionPending: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignCompanyChange: (value: string) => void;
  onAssignCommissionPercentChange: (value: string) => void;
  onAssign: () => void;
  onAssignmentStatusChange: (args: { assignmentId: string; status: "active" | "paused" | "ended" }) => void;
  onCommissionDraftChange: (assignmentId: string, value: string) => void;
  onSaveAssignmentCommission: (assignment: AssignmentLite) => void;
};

export default function ManageAgentCompaniesDialog({
  open,
  manageAgent,
  assignCompanyId,
  assignCommissionPercent,
  assignableCompanies,
  assignments,
  commissionDraftByAssignment,
  createAssignmentPending,
  updateAssignmentStatusPending,
  updateAssignmentCommissionPending,
  onOpenChange,
  onAssignCompanyChange,
  onAssignCommissionPercentChange,
  onAssign,
  onAssignmentStatusChange,
  onCommissionDraftChange,
  onSaveAssignmentCommission,
}: ManageAgentCompaniesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-ds-xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Manage Partner Companies: {manageAgent?.display_name || manageAgent?.email || "Partner"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Company</Label>
              <select
                className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
                value={assignCompanyId}
                onChange={(e) => onAssignCompanyChange(e.target.value)}
              >
                <option value="">Select company...</option>
                {assignableCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Commission %</Label>
              <Input
                className="h-11 rounded-ds-md"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={assignCommissionPercent}
                onChange={(e) => onAssignCommissionPercentChange(e.target.value)}
                placeholder="optional"
              />
            </div>

            <div className="md:col-span-1 flex items-end">
              <Button
                className="h-11 rounded-ds-md w-full"
                disabled={!assignCompanyId || createAssignmentPending}
                onClick={onAssign}
              >
                <Link2 className="h-4 w-4 mr-2" /> Assign
              </Button>
            </div>
          </div>

          <div className="rounded-ds-md border border-border-subtle overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No company assignments for this partner
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{a.companies?.name || a.company_id}</p>
                        <p className="text-xs text-muted-foreground">{a.companies?.slug || ""}</p>
                      </TableCell>
                      <TableCell>
                        <select
                          className="h-8 rounded-lg border border-input bg-background px-2 text-xs capitalize"
                          value={a.status}
                          onChange={(e) =>
                            onAssignmentStatusChange({
                              assignmentId: a.id,
                              status: e.target.value as "active" | "paused" | "ended",
                            })
                          }
                          disabled={updateAssignmentStatusPending}
                        >
                          <option value="active">active</option>
                          <option value="paused">paused</option>
                          <option value="ended">ended</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            className="h-8 w-24 rounded-lg"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={commissionDraftByAssignment[a.id] ?? String(a.commission_percent ?? manageAgent?.default_commission_percent ?? 0)}
                            onChange={(e) => onCommissionDraftChange(a.id, e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            disabled={updateAssignmentCommissionPending}
                            onClick={() => onSaveAssignmentCommission(a)}
                          >
                            Save
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-ds-md" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
