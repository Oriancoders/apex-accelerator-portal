import { Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssignmentRow } from "@/pages/admin/agent-assignments/types";

type AssignmentsTableCardProps = {
  assignments: AssignmentRow[];
  companyNameById: Record<string, string>;
  agentNameById: Record<string, string>;
  onUpdateStatus: (args: { id: string; status: string }) => void;
};

export default function AssignmentsTableCard({
  assignments,
  companyNameById,
  agentNameById,
  onUpdateStatus,
}: AssignmentsTableCardProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <CardTitle className="text-base">Existing Assignments</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{companyNameById[a.company_id] || a.company_id}</TableCell>
                <TableCell>{agentNameById[a.agent_id] || a.agent_id}</TableCell>
                <TableCell>
                  {a.commission_percent !== null ? (
                    <Badge variant="outline"><Percent className="h-3 w-3 mr-1" />{a.commission_percent}%</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Default</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => onUpdateStatus({ id: a.id, status: "active" })}>Activate</Button>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => onUpdateStatus({ id: a.id, status: "paused" })}>Pause</Button>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => onUpdateStatus({ id: a.id, status: "ended" })}>End</Button>
                </TableCell>
              </TableRow>
            ))}
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No assignments yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
