import { AlertCircle } from "lucide-react";

type TicketsHeaderProps = {
  total: number;
  actionCount: number;
  realtimePulse: boolean;
};

export default function TicketsHeader({ total, actionCount, realtimePulse }: TicketsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Manage Tickets</h1>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm text-muted-foreground">{total} total · {actionCount} need action</p>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-500 ${
              realtimePulse
                ? "bg-success/20 border-success/40 text-success scale-110"
                : "bg-success/10 border-success/20 text-success"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-success ${realtimePulse ? "animate-ping" : "animate-pulse"}`} />
            Live
          </span>
        </div>
      </div>
      {actionCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {actionCount} urgent
        </span>
      )}
    </div>
  );
}
