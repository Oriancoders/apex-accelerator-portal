import { PRIORITY_META } from "@/constants/ticket";

interface PriorityBadgeProps {
  priority: string;
  showDot?: boolean;
}

export default function PriorityBadge({ priority, showDot = true }: PriorityBadgeProps) {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.bg} ${m.color}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />}
      {priority}
    </span>
  );
}
