import type { FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatComposerProps = {
  message: string;
  disabled: boolean;
  onMessageChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export default function ChatComposer({ message, disabled, onMessageChange, onSubmit }: ChatComposerProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
      />
      <Button type="submit" size="icon" disabled={disabled || !message.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
