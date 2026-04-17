import { XCircle } from "lucide-react";

export default function CancelledBadge() {
  return (
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
  );
}
