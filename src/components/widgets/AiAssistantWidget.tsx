import { useState, useRef } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AiAssistantWidget() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your Salesforce AI assistant. Ask me anything about Salesforce — admin tips, Apex help, Flow guidance, or best practices." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "This is a placeholder response. Connect an AI API via a backend function to enable real AI responses scoped to Salesforce knowledge." },
    ]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  return (
    <div className="widget-card flex flex-col h-full">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">AI Assistant</h3>
        </div>
        <span className="status-badge bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">Online</span>
      </div>
      {/* Chunking: Chat messages are a single scrollable region */}
      <div ref={scrollRef} className="flex-1 p-4 space-y-3 max-h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      {/* Fitts's Law: Large input + button for easy interaction */}
      <div className="p-4 pt-2 flex gap-2 border-t border-border">
        <Input
          placeholder="Ask a Salesforce question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="text-sm h-11 rounded-xl"
        />
        <Button size="icon" onClick={handleSend} className="flex-shrink-0 h-11 w-11 rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
