import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import ExpertOpinionField from "@/components/proposal-builder/ExpertOpinionField";
import ProposalStepsEditor from "@/components/proposal-builder/ProposalStepsEditor";
import type { Difficulty, Priority, ProposalCategory, ProposalStep } from "@/components/proposal-builder/types";
import { boundedNumberSchema, safeMultilineTextSchema, safeTextSchema } from "@/lib/validation";

const COMPLEXITY_SEQUENCE: Difficulty[] = ["easy", "medium", "hard", "expert"];

const complexityByPosition = (index: number, total: number): Difficulty => {
  if (total <= 1) return "easy";
  const scaled = Math.round((index / (total - 1)) * (COMPLEXITY_SEQUENCE.length - 1));
  return COMPLEXITY_SEQUENCE[Math.max(0, Math.min(scaled, COMPLEXITY_SEQUENCE.length - 1))];
};

const resequenceSteps = (steps: ProposalStep[]): ProposalStep[] =>
  steps.map((step, index, all) => ({
    ...step,
    hour: index + 1,
    complexity: step.complexity ?? complexityByPosition(index, all.length),
    subtasks: step.subtasks ?? [],
  }));

interface ProposalBuilderProps {
  priority: Priority;
  initialSteps?: ProposalStep[];
  initialHours?: number;
  initialCost?: number;
  initialOpinion?: string;
  initialDifficulty?: Difficulty;
  onSubmit: (data: {
    category: ProposalCategory;
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
  const { settings } = useCreditSettings();

  const normalizeInitialSteps = (incoming?: ProposalStep[]) => {
    if (incoming && incoming.length > 0) {
      return resequenceSteps(incoming);
    }
    return [{ hour: 1, title: "", description: "", complexity: "easy" as Difficulty, subtasks: [] }];
  };

  const [steps, setSteps] = useState<ProposalStep[]>(normalizeInitialSteps(initialSteps));
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty || "medium");
  const [manualOverride, setManualOverride] = useState(false);
  const [manualCost, setManualCost] = useState(initialCost?.toString() || "");
  const [expertOpinion, setExpertOpinion] = useState(initialOpinion || "");

  const priorityRate = settings.priorityRates[priority] ?? 15;
  const difficultyRate = settings.difficultyRates[difficulty] ?? 15;
  const perHourRate = priorityRate + difficultyRate;
  const totalHours = steps.length;
  const autoCredit = perHourRate * totalHours;
  const finalCredit = manualOverride ? parseFloat(manualCost) || 0 : autoCredit;

  // Sync manual cost when switching to manual
  useEffect(() => {
    if (manualOverride && !manualCost) {
      setManualCost(autoCredit.toString());
    }
  }, [manualOverride, manualCost, autoCredit]);

  const addStep = () => {
    const next = [
      ...steps,
      {
        hour: steps.length + 1,
        title: "",
        description: "",
        complexity: complexityByPosition(steps.length, steps.length + 1),
        subtasks: [],
      },
    ];
    setSteps(resequenceSteps(next));
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(resequenceSteps(updated));
  };

  const updateStep = (index: number, field: "title" | "description" | "complexity", value: string) => {
    const updated = [...steps];
    if (field === "complexity") {
      updated[index].complexity = COMPLEXITY_SEQUENCE.includes(value as Difficulty) ? (value as Difficulty) : "medium";
    } else {
      updated[index][field] = value;
    }
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
    const safeSteps = steps.slice(0, 40).map((step) => ({
      ...step,
      title: safeTextSchema(160, 1).parse(step.title),
      description: safeMultilineTextSchema(1200, 0).parse(step.description),
      complexity: COMPLEXITY_SEQUENCE.includes(step.complexity) ? step.complexity : "medium",
      subtasks: (step.subtasks || []).slice(0, 20).map((subtask) => ({
        title: safeTextSchema(160, 1).parse(subtask.title),
      })),
    }));
    if (safeSteps.length === 0) return;
    const safeCredit = boundedNumberSchema(1, 100000).parse(finalCredit);
    const safeOpinion = safeMultilineTextSchema(4000, 0).parse(expertOpinion);
    onSubmit({
      category: "general",
      steps: safeSteps,
      estimatedHours: safeSteps.length,
      creditCost: safeCredit,
      expertOpinion: safeOpinion,
      difficultyLevel: difficulty,
    });
  };

  return (
    <div className="space-y-5">
      <ExpertOpinionField value={expertOpinion} onChange={setExpertOpinion} />

      <ProposalStepsEditor
        steps={steps}
        perHourRate={perHourRate}
        onAddStep={addStep}
        onRemoveStep={removeStep}
        onUpdateStep={updateStep}
        onAddSubtask={addSubtask}
        onUpdateSubtask={updateSubtask}
        onRemoveSubtask={removeSubtask}
      />

      <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2 rounded-ds-md" size="lg">
        <Send className="h-4 w-4" />
        {loading ? "Submitting..." : `Submit Proposal (${finalCredit} credits)`}
      </Button>
    </div>
  );
}
