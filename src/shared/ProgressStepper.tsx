import { STAGES, STAGE_IDX, STATUS_META } from "@/constants/ticket";
import { CheckCircle, XCircle } from "lucide-react";

interface ProgressStepperProps {
  status: string;
}

export default function ProgressStepper({ status }: ProgressStepperProps) {
  const isCancelled = status === "cancelled";
  const currentIdx = STAGE_IDX[status] ?? 0;

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-3 px-1 overflow-x-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
          <XCircle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold text-destructive">Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-3 pb-1">
      {/* Track line */}
      <div className="absolute top-[22px] left-4 right-4 h-0.5 bg-border" />
      <div
        className="absolute top-[22px] left-4 h-0.5 bg-primary transition-all duration-700"
        style={{ width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% - 2rem)` }}
      />
      <div className="flex justify-between relative">
        {STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={stage} className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : active
                    ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-[9px] font-medium text-center leading-tight max-w-[52px] ${
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {STATUS_META[stage]?.label || stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
