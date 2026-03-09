import { STATUS_META } from "@/constants/ticket";

interface StatusBadgeProps {
  status: string;
  /** Optionally include the border style for a more prominent badge */
  bordered?: boolean;
}

export default function StatusBadge({ status, bordered = true }: StatusBadgeProps) {
  const m = STATUS_META[status] || STATUS_META.submitted;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.bg} ${m.color} ${bordered ? `border ${m.border}` : ""}`}
    >
      {m.icon}
      {m.label}
    </span>
  );
}
