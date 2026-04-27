import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ExpertOpinionFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ExpertOpinionField({ value, onChange }: ExpertOpinionFieldProps) {
  return (
    <div className="space-y-2">
      <Label>Expert Opinion</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your expert assessment of this request..."
        rows={3}
        maxLength={4000}
      />
    </div>
  );
}
