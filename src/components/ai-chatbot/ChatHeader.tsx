import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  onClose: () => void;
};

export default function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-primary/5">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI Assistant</p>
          <p className="text-[11px] text-muted-foreground">Workflow Guide</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
