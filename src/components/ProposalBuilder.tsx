import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useCreditSettings } from "@/hooks/useCreditSettings";
import ExpertOpinionField from "@/components/proposal-builder/ExpertOpinionField";
import ProposalStepsEditor from "@/components/proposal-builder/ProposalStepsEditor";
import TicketCategoryField from "@/components/proposal-builder/TicketCategoryField";
import type { Difficulty, Priority, ProposalCategory, ProposalStep } from "@/components/proposal-builder/types";

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
  initialCategory?: ProposalCategory;
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
  initialCategory,
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
  const [category, setCategory] = useState<ProposalCategory>(initialCategory || "general");

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
  }, [manualOverride]);

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
      updated[index].complexity = value as Difficulty;
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
    if (steps.some((s) => !s.title.trim())) return;
    if (finalCredit <= 0) return;
    onSubmit({
      category,
      steps,
      estimatedHours: totalHours,
      creditCost: finalCredit,
      expertOpinion,
      difficultyLevel: difficulty,
    });
  };

  return (
    <div className="space-y-5">
      <TicketCategoryField category={category} onCategoryChange={setCategory} />

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

      <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2 rounded-xl" size="lg">
        <Send className="h-4 w-4" />
        {loading ? "Submitting..." : `Submit Proposal (${finalCredit} credits)`}
      </Button>
    </div>
  );
}
