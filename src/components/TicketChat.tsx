import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import ChatComposer from "@/components/ticket-chat/ChatComposer";
import ChatMessagesPane from "@/components/ticket-chat/ChatMessagesPane";
import { useSendTicketMessage } from "@/components/ticket-chat/useSendTicketMessage";
import { useTicketMessages } from "@/components/ticket-chat/useTicketMessages";
import type { TicketChatProps } from "@/components/ticket-chat/types";

export default function TicketChat({ ticketId, isAdmin = false }: TicketChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages } = useTicketMessages(ticketId);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMutation = useSendTicketMessage(ticketId, user?.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim(), {
      onSuccess: () => setMessage(""),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Ticket Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChatMessagesPane messages={messages} isAdmin={isAdmin} scrollRef={scrollRef} />
        <ChatComposer
          message={message}
          onMessageChange={setMessage}
          disabled={sendMutation.isPending}
          onSubmit={handleSend}
        />
      </CardContent>
    </Card>
  );
}
