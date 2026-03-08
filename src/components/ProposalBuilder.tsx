import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Send } from "lucide-react";

interface ProposalStep {
  hour: number;
  title: string;
  description: string;
}

interface ProposalBuilderProps {
  initialSteps?: ProposalStep[];
  initialHours?: number;
  initialCost?: number;
  initialOpinion?: string;
  onSubmit: (data: { steps: ProposalStep[]; estimatedHours: number; creditCost: number; expertOpinion: string }) => void;
  loading?: boolean;
}

export default function ProposalBuilder({ initialSteps, initialHours, initialCost, initialOpinion, onSubmit, loading }: ProposalBuilderProps) {
  const [steps, setSteps] = useState<ProposalStep[]>(
    initialSteps || [{ hour: 1, title: "", description: "" }]
  );
  const [creditCost, setCreditCost] = useState(initialCost?.toString() || "");
  const [expertOpinion, setExpertOpinion] = useState(initialOpinion || "");

  const addStep = () => {
    setSteps([...steps, { hour: steps.length + 1, title: "", description: "" }]);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, hour: i + 1 }));
    setSteps(updated);
  };

  const updateStep = (index: number, field: keyof ProposalStep, value: string) => {
    const updated = [...steps];
    if (field === "hour") {
      updated[index][field] = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setSteps(updated);
  };

  const handleSubmit = () => {
    if (steps.some((s) => !s.title.trim())) return;
    if (!creditCost) return;
    onSubmit({
      steps,
      estimatedHours: steps.length,
      creditCost: parseInt(creditCost),
      expertOpinion,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Expert Opinion</Label>
        <Textarea
          value={expertOpinion}
          onChange={(e) => setExpertOpinion(e.target.value)}
          placeholder="Your expert assessment of this request..."
          rows={3}
        />
      </div>

      <div>
        <Label>Credit Cost (total)</Label>
        <Input
          type="number"
          value={creditCost}
          onChange={(e) => setCreditCost(e.target.value)}
          placeholder="e.g. 15"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Action Steps (per hour)</Label>
          <Button variant="outline" size="sm" onClick={addStep} className="gap-1">
            <Plus className="h-3 w-3" /> Add Step
          </Button>
        </div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <Card key={i} className="border-dashed">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Hour {step.hour}</span>
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
                />
                <Textarea
                  placeholder="Description of work for this hour..."
                  value={step.description}
                  onChange={(e) => updateStep(i, "description", e.target.value)}
                  rows={2}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
        <Send className="h-4 w-4" />
        {loading ? "Submitting..." : "Submit Proposal to User"}
      </Button>
    </div>
  );
}
