import { Database } from "@/integrations/supabase/types";
import { XCircle } from "lucide-react";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const stages: { key: TicketStatus; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const statusIndex: Record<TicketStatus, number> = {
  submitted: 0,
  under_review: 1,
  approved: 2,
  in_progress: 3,
  completed: 4,
  cancelled: -1,
};

export default function PathTracker({ status }: { status: TicketStatus }) {
  const isCancelled = status === "cancelled";
  const currentIdx = statusIndex[status];

  if (isCancelled) {
    return (
      <div className="flex items-center w-full overflow-x-auto py-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground line-through opacity-50">
                {i + 1}
              </div>
              <span className="text-[10px] mt-1 text-center leading-tight text-muted-foreground line-through opacity-50">
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 bg-destructive/30" />
            )}
          </div>
        ))}
        {/* Cancelled badge at end */}
        <div className="flex items-center flex-shrink-0 ml-2">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground">
              <XCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] mt-1 text-center leading-tight font-semibold text-destructive">
              Cancelled
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full overflow-x-auto py-2">
      {stages.map((stage, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={stage.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-success text-success-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground animate-pulse-glow"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight ${
                isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
              }`}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${
                i < currentIdx ? "bg-success" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
