import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ChatLauncher from "@/components/ai-chatbot/ChatLauncher";
import ChatPanel from "@/components/ai-chatbot/ChatPanel";
import { streamChat } from "@/components/ai-chatbot/streamChat";
import type { Msg } from "@/components/ai-chatbot/types";

export default function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm your **CustomerPortol AI assistant**. Ask me anything about onboarding, tickets, proposals, pricing, and delivery workflows.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          toast.error(err);
          setIsLoading(false);
        },
      });
    } catch {
      toast.error("Failed to connect to AI. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && <ChatLauncher onOpen={() => setOpen(true)} />}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <ChatPanel
            messages={messages}
            input={input}
            isLoading={isLoading}
            scrollRef={scrollRef}
            inputRef={inputRef}
            onClose={() => setOpen(false)}
            onInputChange={setInput}
            onSend={send}
          />
        )}
      </AnimatePresence>
    </>
  );
}
