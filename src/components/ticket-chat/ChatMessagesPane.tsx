import { format } from "date-fns";
import type { ChatMessage } from "@/components/ticket-chat/types";

type ChatMessagesPaneProps = {
  messages: ChatMessage[];
  isAdmin: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

function senderLabel(senderType: ChatMessage["sender_type"]) {
  if (senderType === "admin") return "Admin";
  if (senderType === "system") return "System";
  return "You";
}

export default function ChatMessagesPane({ messages, isAdmin, scrollRef }: ChatMessagesPaneProps) {
  return (
    <div ref={scrollRef} className="h-64 overflow-y-auto border rounded-lg p-3 mb-3 space-y-3 bg-muted/30">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation.</p>
      ) : (
        messages.map((msg) => {
          const isMe = (isAdmin && msg.sender_type === "admin") || (!isAdmin && msg.sender_type === "user");
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  msg.sender_type === "admin"
                    ? "bg-primary text-primary-foreground"
                    : msg.sender_type === "system"
                      ? "bg-muted text-muted-foreground italic"
                      : "bg-card border"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.sender_type === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {senderLabel(msg.sender_type)} · {format(new Date(msg.created_at), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
