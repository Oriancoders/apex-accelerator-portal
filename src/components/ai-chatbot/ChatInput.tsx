import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  input: string;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export default function ChatInput({ input, isLoading, inputRef, onInputChange, onSend }: ChatInputProps) {
  return (
    <div className="p-3 border-t border-border-subtle">
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          placeholder="Ask about tickets, credits, or delivery..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          className="flex-1 resize-none rounded-ds-md border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={isLoading || !input.trim()}
          className="h-10 w-10 rounded-ds-md flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
