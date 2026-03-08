import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Send, Calculator, Zap, ListPlus } from "lucide-react";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import type { Database } from "@/integrations/supabase/types";

type Priority = Database["public"]["Enums"]["ticket_priority"];
type Difficulty = "easy" | "medium" | "hard" | "expert";

// Credit rates
const PRIORITY_CREDITS: Record<Priority, number> = {
  low: 10,
  medium: 15,
  high: 20,
  critical: 30,
};

const DIFFICULTY_CREDITS: Record<Difficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 20,
  expert: 30,
};

interface SubTask {
  title: string;
}

interface ProposalStep {
  hour: number;
  title: string;
  description: string;
  subtasks?: SubTask[];
}

interface ProposalBuilderProps {
  priority: Priority;
  initialSteps?: ProposalStep[];
  initialHours?: number;
  initialCost?: number;
  initialOpinion?: string;
  initialDifficulty?: Difficulty;
  onSubmit: (data: {
    steps: ProposalStep[];
    estimatedHours: number;
    creditCost: number;
    expertOpinion: string;
    difficultyLevel: Difficulty;
  }) => void;
  loading?: boolean;
}

export default function ProposalBuilder({
  priority,
  initialSteps,
  initialHours,
  initialCost,
  initialOpinion,
  initialDifficulty,
  onSubmit,
  loading,
}: ProposalBuilderProps) {
  const [steps, setSteps] = useState<ProposalStep[]>(
    initialSteps || [{ hour: 1, title: "", description: "", subtasks: [] }]
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty || "medium");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualCost, setManualCost] = useState(initialCost?.toString() || "");
  const [expertOpinion, setExpertOpinion] = useState(initialOpinion || "");

  const priorityRate = PRIORITY_CREDITS[priority];
  const difficultyRate = DIFFICULTY_CREDITS[difficulty];
  const perHourRate = priorityRate + difficultyRate;
  const totalHours = steps.length;
  const autoCredit = perHourRate * totalHours;
  const finalCredit = manualOverride ? parseInt(manualCost) || 0 : autoCredit;

  // Sync manual cost when switching to manual
  useEffect(() => {
    if (manualOverride && !manualCost) {
      setManualCost(autoCredit.toString());
    }
  }, [manualOverride]);

  const addStep = () => {
    setSteps([...steps, { hour: steps.length + 1, title: "", description: "", subtasks: [] }]);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, hour: i + 1 }));
    setSteps(updated);
  };

  const updateStep = (index: number, field: "title" | "description", value: string) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const addSubtask = (stepIndex: number) => {
    const updated = [...steps];
    if (!updated[stepIndex].subtasks) updated[stepIndex].subtasks = [];
    updated[stepIndex].subtasks!.push({ title: "" });
    setSteps(updated);
  };

  const updateSubtask = (stepIndex: number, subIndex: number, value: string) => {
    const updated = [...steps];
    updated[stepIndex].subtasks![subIndex].title = value;
    setSteps(updated);
  };

  const removeSubtask = (stepIndex: number, subIndex: number) => {
    const updated = [...steps];
    updated[stepIndex].subtasks = updated[stepIndex].subtasks!.filter((_, i) => i !== subIndex);
    setSteps(updated);
  };

  const handleSubmit = () => {
    if (steps.some((s) => !s.title.trim())) return;
    if (finalCredit <= 0) return;
    onSubmit({
      steps,
      estimatedHours: totalHours,
      creditCost: finalCredit,
      expertOpinion,
      difficultyLevel: difficulty,
    });
  };

  return (
    <div className="space-y-5">
      {/* Expert Opinion */}
      <div className="space-y-2">
        <Label>Expert Opinion</Label>
        <Textarea
          value={expertOpinion}
          onChange={(e) => setExpertOpinion(e.target.value)}
          placeholder="Your expert assessment of this request..."
          rows={3}
        />
      </div>

      {/* Pricing Calculator */}
      <Card className="border-primary/20 bg-primary/5 rounded-xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Calculator className="h-4 w-4" />
            Credit Pricing Calculator
          </div>

          {/* Priority + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priority (set by user)</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">{priority}</Badge>
                <span className="text-xs font-semibold text-primary">{priorityRate} cr/hr</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger className="h-9 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy (10 cr/hr)</SelectItem>
                  <SelectItem value="medium">🟡 Medium (15 cr/hr)</SelectItem>
                  <SelectItem value="hard">🟠 Hard (20 cr/hr)</SelectItem>
                  <SelectItem value="expert">🔴 Expert (30 cr/hr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formula breakdown */}
          <div className="bg-background/80 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority rate:</span>
              <span className="font-medium">{priorityRate} credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulty rate:</span>
              <span className="font-medium">{difficultyRate} credits</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Per hour rate:</span>
              <span className="text-primary">{perHourRate} credits/hr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total hours:</span>
              <span className="font-medium">{totalHours}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-sm font-bold">
              <span>Auto-calculated total:</span>
              <span className="text-primary">{autoCredit} credits</span>
            </div>
          </div>

          {/* Manual override */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <Label className="text-xs cursor-pointer">Manual Override (rush/custom pricing)</Label>
            </div>
            <Switch checked={manualOverride} onCheckedChange={setManualOverride} />
          </div>

          {manualOverride && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Custom Credit Cost</Label>
              <Input
                type="number"
                value={manualCost}
                onChange={(e) => setManualCost(e.target.value)}
                placeholder="Enter custom credit amount"
                className="h-9 rounded-lg"
              />
              <p className="text-[10px] text-muted-foreground">
                Use for rush jobs or special pricing. The user will see this custom amount.
              </p>
            </div>
          )}

          {/* Final cost */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-semibold">Final Credit Cost:</span>
            <span className="text-lg font-bold text-primary">{finalCredit} credits</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Steps with Sub-tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Action Steps (per hour)</Label>
          <Button variant="outline" size="sm" onClick={addStep} className="gap-1 rounded-lg h-8 text-xs">
            <Plus className="h-3 w-3" /> Add Hour
          </Button>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <Card key={i} className="border-dashed rounded-xl">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">Hour {step.hour}</span>
                    <Badge variant="outline" className="text-[10px]">{perHourRate} cr</Badge>
                  </div>
                  {steps.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStep(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Step title (e.g., Setup & Access)"
                  value={step.title}
                  onChange={(e) => updateStep(i, "title", e.target.value)}
                  className="h-9 rounded-lg text-sm"
                />
                <Textarea
                  placeholder="Description of work for this hour..."
                  value={step.description}
                  onChange={(e) => updateStep(i, "description", e.target.value)}
                  rows={2}
                  className="text-sm"
                />

                {/* Sub-tasks */}
                <div className="pl-3 border-l-2 border-primary/20 space-y-1.5">
                  {(step.subtasks || []).map((sub, si) => (
                    <div key={si} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground w-4">{si + 1}.</span>
                      <Input
                        placeholder="Sub-task action..."
                        value={sub.title}
                        onChange={(e) => updateSubtask(i, si, e.target.value)}
                        className="h-7 text-xs rounded-md flex-1"
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => removeSubtask(i, si)}>
                        <Trash2 className="h-2.5 w-2.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                    onClick={() => addSubtask(i)}
                  >
                    <ListPlus className="h-3 w-3" /> Add sub-task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2 rounded-xl" size="lg">
        <Send className="h-4 w-4" />
        {loading ? "Submitting..." : `Submit Proposal (${finalCredit} credits)`}
      </Button>
    </div>
  );
}
