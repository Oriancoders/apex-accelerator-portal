import { Handshake, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AgentRow, CompanyRow } from "@/pages/admin/agent-assignments/types";

type AssignmentFormCardProps = {
  companies: CompanyRow[];
  agents: AgentRow[];
  companyId: string;
  agentId: string;
  commissionPercent: string;
  onCompanyChange: (value: string) => void;
  onAgentChange: (value: string) => void;
  onCommissionPercentChange: (value: string) => void;
  onCreate: () => void;
};

export default function AssignmentFormCard({
  companies,
  agents,
  companyId,
  agentId,
  commissionPercent,
  onCompanyChange,
  onAgentChange,
  onCommissionPercentChange,
  onCreate,
}: AssignmentFormCardProps) {
  return (
    <Card className="rounded-ds-xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Handshake className="h-4 w-4 text-primary" />
          Assign Agent To Company
        </CardTitle>
        <CardDescription>Create assignment records and optional commission override.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Company</Label>
          <select
            className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
            value={companyId}
            onChange={(e) => onCompanyChange(e.target.value)}
          >
            <option value="">Select company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label>Agent</Label>
          <select
            className="w-full h-11 rounded-ds-md border border-input bg-background px-3 text-sm"
            value={agentId}
            onChange={(e) => onAgentChange(e.target.value)}
          >
            <option value="">Select agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {(a.display_name || "Agent")} ({a.email || "no-email"})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-1">
          <Label>Commission % (optional)</Label>
          <Input
            className="h-11 rounded-ds-md"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={commissionPercent}
            onChange={(e) => onCommissionPercentChange(e.target.value)}
            placeholder="e.g. 12.5"
          />
        </div>

        <div className="md:col-span-3 flex items-end justify-end">
          <Button className="h-11 rounded-ds-md" onClick={onCreate}>
            <Link2 className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
