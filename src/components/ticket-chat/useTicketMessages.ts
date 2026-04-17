import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage } from "@/components/ticket-chat/types";

export function useTicketMessages(ticketId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-messages", ticketId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      return (data || []) as ChatMessage[];
    },
    enabled: !!ticketId,
  });

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  return {
    messages: query.data || [],
  };
}
