import { Award, ClipboardCheck, PlayCircle, Target } from "lucide-react";

type TicketsStatsRowProps = {
  submitted: number;
  inProgress: number;
  uat: number;
  completed: number;
  onStatusClick: (status: string) => void;
};

export default function TicketsStatsRow({
  submitted,
  inProgress,
  uat,
  completed,
  onStatusClick,
}: TicketsStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        {
          label: "Submitted",
          count: submitted,
          color: "text-warning",
          bg: "bg-warning/5 border-warning/20",
          icon: <ClipboardCheck className="h-4 w-4" />,
          status: "submitted",
        },
        {
          label: "In Progress",
          count: inProgress,
          color: "text-accent",
          bg: "bg-accent/5 border-accent/20",
          icon: <PlayCircle className="h-4 w-4" />,
          status: "in_progress",
        },
        {
          label: "UAT",
          count: uat,
          color: "text-info",
          bg: "bg-info/5 border-info/20",
          icon: <Target className="h-4 w-4" />,
          status: "uat",
        },
        {
          label: "Completed",
          count: completed,
          color: "text-success",
          bg: "bg-success/5 border-success/20",
          icon: <Award className="h-4 w-4" />,
          status: "completed",
        },
      ].map(({ label, count, color, bg, icon, status }) => (
        <div
          key={label}
          className={`p-3 rounded-ds-md border ${bg} text-center cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => onStatusClick(status)}
        >
          <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
          <p className={`text-xl font-bold ${color}`}>{count}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        </div>
      ))}
    </div>
  );
}
