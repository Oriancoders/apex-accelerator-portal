import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TicketChatProps {
  ticketId: string;
  isAdmin?: boolean;
}

export default function TicketChat({ ticketId, isAdmin = false }: TicketChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", ticketId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!ticketId,
  });

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `ticket_id=eq.${ticketId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", ticketId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const { error } = await supabase.from("chat_messages").insert({
        ticket_id: ticketId,
        user_id: user?.id || null,
        sender_type: isAdmin ? "admin" : "user",
        message: msg,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", ticketId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
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
        <div ref={scrollRef} className="h-64 overflow-y-auto border rounded-lg p-3 mb-3 space-y-3 bg-muted/30">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation.</p>
          ) : (
            messages.map((msg) => {
              const isMe = (isAdmin && msg.sender_type === "admin") || (!isAdmin && msg.sender_type === "user");
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    msg.sender_type === "admin"
                      ? "bg-primary text-primary-foreground"
                      : msg.sender_type === "system"
                      ? "bg-muted text-muted-foreground italic"
                      : "bg-card border"
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${
                      msg.sender_type === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {msg.sender_type === "admin" ? "Admin" : msg.sender_type === "system" ? "System" : "You"} · {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendMutation.isPending}
          />
          <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
