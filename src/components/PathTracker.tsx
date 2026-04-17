import CancelledBadge from "@/components/path-tracker/CancelledBadge";
import { stages, statusIndex } from "@/components/path-tracker/data";
import StageConnector from "@/components/path-tracker/StageConnector";
import StageNode from "@/components/path-tracker/StageNode";
import type { TicketStatus } from "@/components/path-tracker/types";

export default function PathTracker({ status }: { status: TicketStatus }) {
  const isCancelled = status === "cancelled";
  const currentIdx = statusIndex[status];

  if (isCancelled) {
    return (
      <div className="flex items-center w-full overflow-x-auto py-2">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex items-center flex-1 min-w-0">
            <StageNode label={stage.label} stepNumber={i + 1} isCancelledView />
            {i < stages.length - 1 && (
              <StageConnector variant="cancelled" />
            )}
          </div>
        ))}
        <CancelledBadge />
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
            <StageNode
              label={stage.label}
              stepNumber={i + 1}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
            />
            {i < stages.length - 1 && (
              <StageConnector variant={i < currentIdx ? "success" : "default"} />
            )}
          </div>
        );
      })}
    </div>
  );
}
