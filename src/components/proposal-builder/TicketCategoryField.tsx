import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProposalCategory } from "@/components/proposal-builder/types";

type TicketCategoryFieldProps = {
  category: ProposalCategory;
  onCategoryChange: (category: ProposalCategory) => void;
};

export default function TicketCategoryField({ category, onCategoryChange }: TicketCategoryFieldProps) {
  return (
    <div className="space-y-2">
      <Label>Ticket Category</Label>
      <Select value={category} onValueChange={(v) => onCategoryChange(v as ProposalCategory)}>
        <SelectTrigger className="h-10 rounded-lg text-sm">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general">General</SelectItem>
          <SelectItem value="salesforce">Salesforce</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Choose Salesforce to enable Sandbox Connect after client approval.
      </p>
    </div>
  );
}
