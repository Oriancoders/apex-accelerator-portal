import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFacingError } from "@/lib/errors";
import { safeMultilineTextSchema, uuidSchema } from "@/lib/validation";

export function useSendTicketMessage(ticketId: string, userId?: string) {
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      if (!userId) throw new Error("Not authenticated");
      const safeTicketId = uuidSchema.parse(ticketId);
      const message = safeMultilineTextSchema(2000, 1).parse(msg);
      const { error } = await supabase.from("chat_messages").insert({
        ticket_id: safeTicketId,
        user_id: userId,
        sender_type: "user",
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", ticketId] });
    },
    onError: (err: Error) => toast.error(getUserFacingError(err, "Unable to send message right now.")),
  });

  return sendMutation;
}
