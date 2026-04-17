import { motion } from "framer-motion";
import type { Msg } from "@/components/ai-chatbot/types";
import ChatHeader from "@/components/ai-chatbot/ChatHeader";
import ChatInput from "@/components/ai-chatbot/ChatInput";
import ChatMessages from "@/components/ai-chatbot/ChatMessages";

type ChatPanelProps = {
  messages: Msg[];
  input: string;
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export default function ChatPanel({
  messages,
  input,
  isLoading,
  scrollRef,
  inputRef,
  onClose,
  onInputChange,
  onSend,
}: ChatPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-5 right-5 z-50 w-[360px] sm:w-[400px] h-[520px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
    >
      <ChatHeader onClose={onClose} />
      <ChatMessages messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
      <ChatInput
        input={input}
        isLoading={isLoading}
        inputRef={inputRef}
        onInputChange={onInputChange}
        onSend={onSend}
      />
    </motion.div>
  );
}
