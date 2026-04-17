import { Pencil, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { CompanyRow, PayoutModel, RuleRow } from "@/pages/admin/agent-assignments/types";

type CommissionRulesCardProps = {
  companies: CompanyRow[];
  ruleCompanyId: string;
  ruleName: string;
  payoutModel: PayoutModel;
  rulePercent: string;
  flatAmount: string;
  priority: string;
  companyRules: RuleRow[];
  onRuleCompanyChange: (value: string) => void;
  onRuleNameChange: (value: string) => void;
  onPayoutModelChange: (value: PayoutModel) => void;
  onRulePercentChange: (value: string) => void;
  onFlatAmountChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCreateRule: () => void;
  onToggleRuleActive: (args: { id: string; next: boolean }) => void;
  onEditRule: (rule: RuleRow) => void;
  onDeleteRule: (rule: RuleRow) => void;
};

export default function CommissionRulesCard({
  companies,
  ruleCompanyId,
  ruleName,
  payoutModel,
  rulePercent,
  flatAmount,
  priority,
  companyRules,
  onRuleCompanyChange,
  onRuleNameChange,
  onPayoutModelChange,
  onRulePercentChange,
  onFlatAmountChange,
  onPriorityChange,
  onCreateRule,
  onToggleRuleActive,
  onEditRule,
  onDeleteRule,
}: CommissionRulesCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          Per-Company Commission Rules
        </CardTitle>
        <CardDescription>Define payout logic by company scope.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Company</Label>
            <select
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
              value={ruleCompanyId}
              onChange={(e) => onRuleCompanyChange(e.target.value)}
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <Label>Rule name</Label>
            <Input className="h-11 rounded-xl" value={ruleName} onChange={(e) => onRuleNameChange(e.target.value)} />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <Label>Priority</Label>
            <Input className="h-11 rounded-xl" type="number" value={priority} onChange={(e) => onPriorityChange(e.target.value)} />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <Label>Payout model</Label>
            <select
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm"
              value={payoutModel}
              onChange={(e) => onPayoutModelChange(e.target.value as PayoutModel)}
            >
              <option value="percentage">percentage</option>
              <option value="flat">flat</option>
            </select>
          </div>

          {payoutModel === "percentage" ? (
            <div className="space-y-1.5 md:col-span-1">
              <Label>Commission %</Label>
              <Input className="h-11 rounded-xl" type="number" value={rulePercent} onChange={(e) => onRulePercentChange(e.target.value)} min="0" max="100" step="0.01" />
            </div>
          ) : (
            <div className="space-y-1.5 md:col-span-1">
              <Label>Flat amount</Label>
              <Input className="h-11 rounded-xl" type="number" value={flatAmount} onChange={(e) => onFlatAmountChange(e.target.value)} min="0" step="0.01" />
            </div>
          )}

          <div className="md:col-span-2 flex items-end justify-end">
            <Button className="h-11 rounded-xl" onClick={onCreateRule}>Create Rule</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.rule_name}</TableCell>
                  <TableCell>{rule.payout_model}</TableCell>
                  <TableCell>
                    {rule.payout_model === "percentage"
                      ? `${rule.commission_percent ?? 0}%`
                      : `${rule.flat_amount ?? 0} ${rule.currency}`}
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>{rule.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => onToggleRuleActive({ id: rule.id, next: !rule.is_active })}
                    >
                      {rule.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => onEditRule(rule)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-destructive"
                      onClick={() => onDeleteRule(rule)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {ruleCompanyId && companyRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No company rules yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
