type StageNodeProps = {
  label: string;
  stepNumber: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isCancelledView?: boolean;
};

export default function StageNode({
  label,
  stepNumber,
  isCompleted = false,
  isCurrent = false,
  isCancelledView = false,
}: StageNodeProps) {
  if (isCancelledView) {
    return (
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground line-through opacity-50">
          {stepNumber}
        </div>
        <span className="text-[10px] mt-1 text-center leading-tight text-muted-foreground line-through opacity-50">
          {label}
        </span>
      </div>
    );
  }

  return (
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
        {isCompleted ? "✓" : stepNumber}
      </div>
      <span
        className={`text-[10px] mt-1 text-center leading-tight ${
          isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
