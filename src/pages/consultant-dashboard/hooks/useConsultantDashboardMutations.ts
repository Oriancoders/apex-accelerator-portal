import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFacingError } from "@/lib/errors";

type TicketStatus = "submitted" | "under_review" | "approved" | "in_progress" | "uat" | "completed" | "cancelled";

type ConsultantTicketSnapshot = {
  status: TicketStatus;
  assignment_status: string | null;
};

async function fetchAssignedTicket(ticketId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("status, assignment_status")
    .eq("id", ticketId)
    .single();

  if (error) throw error;
  return data as ConsultantTicketSnapshot;
}

async function insertConsultantEvent({
  ticketId,
  fromStatus,
  toStatus,
  note,
  attachments,
}: {
  ticketId: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  note: string;
  attachments?: string[] | null;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("ticket_events").insert({
    ticket_id: ticketId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: userId,
    note,
    attachments: attachments ?? null,
  });

  if (error) {
    console.warn("Unable to write consultant ticket event:", error);
  }
}

async function respondAssignmentWithoutRpc(ticketId: string, accept: boolean) {
  const ticket = await fetchAssignedTicket(ticketId);

  if (ticket.assignment_status !== "pending") {
    throw new Error("This assignment has already been answered.");
  }

  const nextStatus: TicketStatus = accept
    ? ["approved", "under_review", "submitted"].includes(ticket.status)
      ? "in_progress"
      : ticket.status
    : "approved";

  const note = accept
    ? "Consultant accepted this ticket assignment."
    : "Consultant declined this ticket assignment.";

  const { error } = await supabase
    .from("tickets")
    .update({
      assignment_status: accept ? "accepted" : "rejected",
      consultant_accepted_at: accept ? new Date().toISOString() : null,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .select("id")
    .single();

  if (error) throw error;

  await insertConsultantEvent({
    ticketId,
    fromStatus: ticket.status,
    toStatus: nextStatus,
    note,
  });
}

async function sendToUatWithoutRpc(ticketId: string) {
  const ticket = await fetchAssignedTicket(ticketId);

  if (ticket.assignment_status !== "accepted") {
    throw new Error("Assignment must be accepted before sending to UAT.");
  }

  if (ticket.status !== "in_progress") {
    throw new Error("Only in-progress tickets can be sent to UAT.");
  }

  const note = "Consultant completed implementation and sent to UAT.";
  const { error } = await supabase
    .from("tickets")
    .update({
      status: "uat",
      consultant_completed_at: new Date().toISOString(),
      uat_notes: note,
      uat_attachments: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .select("id")
    .single();

  if (error) throw error;

  await insertConsultantEvent({
    ticketId,
    fromStatus: "in_progress",
    toStatus: "uat",
    note,
  });
}

export function useRespondAssignmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, accept }: { ticketId: string; accept: boolean }) => {
      await respondAssignmentWithoutRpc(ticketId, accept);
    },
    onSuccess: () => {
      toast.success("Assignment response saved.");
      queryClient.invalidateQueries({ queryKey: ["consultant-assigned-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (error: Error) => {
      toast.error(getUserFacingError(error, "Unable to update assignment right now."));
    },
  });
}

export function useSendToUatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      await sendToUatWithoutRpc(ticketId);
    },
    onSuccess: () => {
      toast.success("Ticket moved to UAT.");
      queryClient.invalidateQueries({ queryKey: ["consultant-assigned-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (error: Error) => {
      toast.error(getUserFacingError(error, "Unable to send ticket to UAT right now."));
    },
  });
}
