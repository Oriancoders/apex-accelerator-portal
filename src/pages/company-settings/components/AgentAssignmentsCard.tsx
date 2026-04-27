import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";
import type { AssignmentRow } from "../types";

interface AgentAssignmentsCardProps {
  assignments: AssignmentRow[];
  canManage: boolean;
  commissionDraftByAssignment: Record<string, string>;
  setCommissionDraftByAssignment: (draft: Record<string, string>) => void;
  updateMutation: any;
}

export function AgentAssignmentsCard({
  assignments,
  canManage,
  commissionDraftByAssignment,
  setCommissionDraftByAssignment,
  updateMutation,
}: AgentAssignmentsCardProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserCog className="h-4 w-4 text-primary" /> Assigned Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No agents assigned yet</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-ds-md border border-border-subtle px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{a.agents?.display_name || "Assigned Agent"}</p>
                  <p className="text-[10px] text-muted-foreground">{a.agents?.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {(a.commission_percent ?? a.agents?.default_commission_percent ?? 0)}%
                  </Badge>
                  {canManage && (
                    <>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-xs"
                        value={commissionDraftByAssignment[a.id] ?? String(a.commission_percent ?? a.agents?.default_commission_percent ?? 0)}
                        onChange={(e) =>
                          setCommissionDraftByAssignment({ ...commissionDraftByAssignment, [a.id]: e.target.value })
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            assignmentId: a.id,
                            value:
                              commissionDraftByAssignment[a.id] ??
                              String(a.commission_percent ?? a.agents?.default_commission_percent ?? 0),
                          })
                        }
                      >
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
