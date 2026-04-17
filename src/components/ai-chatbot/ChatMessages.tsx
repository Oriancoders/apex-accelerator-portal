import { Loader2 } from "lucide-react";
import { renderContent } from "@/components/ai-chatbot/renderContent";
import type { Msg } from "@/components/ai-chatbot/types";

type ChatMessagesProps = {
  messages: Msg[];
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

export default function ChatMessages({ messages, isLoading, scrollRef }: ChatMessagesProps) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}
          >
            {m.role === "assistant" ? renderContent(m.content) : m.content}
          </div>
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
