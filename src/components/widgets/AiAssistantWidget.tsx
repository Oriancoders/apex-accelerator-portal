import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AiAssistantWidget() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your Salesforce AI assistant. Ask me anything about Salesforce — admin tips, Apex help, Flow guidance, or best practices." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "This is a placeholder response. Connect an AI API (e.g., OpenAI) via an edge function to enable real AI responses scoped to Salesforce knowledge." },
    ]);
    setInput("");
  };

  return (
    <div className="widget-card flex flex-col">
      <div className="widget-card-header">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">AI Assistant</h3>
        </div>
        <span className="status-badge bg-success/10 text-success">Online</span>
      </div>
      <div className="flex-1 p-4 space-y-3 max-h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 pt-0 flex gap-2">
        <Input
          placeholder="Ask a Salesforce question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="text-sm"
        />
        <Button size="icon" onClick={handleSend} className="flex-shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
