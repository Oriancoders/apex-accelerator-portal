import { ListPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProposalStep } from "@/components/proposal-builder/types";

type ProposalStepsEditorProps = {
  steps: ProposalStep[];
  perHourRate: number;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, field: "title" | "description" | "complexity", value: string) => void;
  onAddSubtask: (stepIndex: number) => void;
  onUpdateSubtask: (stepIndex: number, subIndex: number, value: string) => void;
  onRemoveSubtask: (stepIndex: number, subIndex: number) => void;
};

export default function ProposalStepsEditor({
  steps,
  perHourRate,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onAddSubtask,
  onUpdateSubtask,
  onRemoveSubtask,
}: ProposalStepsEditorProps) {
  const complexityTone = (complexity: ProposalStep["complexity"]) => {
    if (complexity === "easy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (complexity === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
    if (complexity === "hard") return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Action Steps (per hour)</Label>
        <Button variant="outline" size="sm" onClick={onAddStep} className="gap-1 rounded-lg h-8 text-xs">
          <Plus className="h-3 w-3" /> Add Hour
        </Button>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <Card key={i} className="border-dashed rounded-ds-md">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">Hour {step.hour}</span>
                  <Badge variant="outline" className="text-[10px]">{perHourRate} cr</Badge>
                  <Badge variant="outline" className={`text-[10px] capitalize ${complexityTone(step.complexity)}`}>
                    {step.complexity}
                  </Badge>
                </div>
                {steps.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveStep(i)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
              <Input
                placeholder="Step title (e.g., Setup & Access)"
                value={step.title}
                onChange={(e) => onUpdateStep(i, "title", e.target.value)}
                className="h-9 rounded-lg text-sm"
                maxLength={160}
              />
              <Textarea
                placeholder="Description of work for this hour..."
                value={step.description}
                onChange={(e) => onUpdateStep(i, "description", e.target.value)}
                rows={2}
                className="text-sm"
                maxLength={1200}
              />

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Hour complexity</Label>
                <Select value={step.complexity} onValueChange={(value) => onUpdateStep(i, "complexity", value)}>
                  <SelectTrigger className="h-8 text-xs rounded-lg w-[180px]">
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pl-3 border-l-2 border-primary/20 space-y-1.5">
                {(step.subtasks || []).map((sub, si) => (
                  <div key={si} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground w-4">{si + 1}.</span>
                    <Input
                      placeholder="Sub-task action..."
                      value={sub.title}
                      onChange={(e) => onUpdateSubtask(i, si, e.target.value)}
                      className="h-7 text-xs rounded-md flex-1"
                      maxLength={160}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => onRemoveSubtask(i, si)}
                    >
                      <Trash2 className="h-2.5 w-2.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                  onClick={() => onAddSubtask(i)}
                >
                  <ListPlus className="h-3 w-3" /> Add sub-task
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
