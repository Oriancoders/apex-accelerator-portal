import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUserFacingError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { fetchActiveSubscription } from "@/lib/subscriptions";

type Ticket = Tables<"tickets">;
type TicketEvent = Tables<"ticket_events">;

export function useTicketData(ticketId?: string) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data } = await supabase.from("tickets").select("*").eq("id", ticketId).single();
      return data as Ticket | null;
    },
    enabled: !!ticketId,
  });
}

export function useTicketEvents(ticketId?: string) {
  return useQuery({
    queryKey: ["ticket-events", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data } = await supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      return (data || []) as TicketEvent[];
    },
    enabled: !!ticketId,
  });
}

export function useTicketReview(ticketId?: string, userId?: string) {
  return useQuery({
    queryKey: ["ticket-review", ticketId],
    queryFn: async () => {
      if (!ticketId || !userId) return null;
      const { data } = await supabase.from("ticket_reviews").select("*").eq("ticket_id", ticketId).eq("user_id", userId).maybeSingle();
      return data;
    },
    enabled: !!ticketId && !!userId,
  });
}

export function useTicketActiveSubscription(companyId?: string | null) {
  return useQuery({
    queryKey: ["company-active-subscription", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      return fetchActiveSubscription(companyId);
    },
    enabled: !!companyId,
  });
}

export function useTicketMutations(ticketId?: string, userId?: string) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ creditCost, userCredits }: { creditCost: number; userCredits: number }) => {
      if (!ticketId || !userId) throw new Error("Missing data");
      const approvedCost = Number(creditCost);
      if (!Number.isFinite(approvedCost) || approvedCost <= 0) {
        throw new Error("The approved credit amount is missing. Please refresh the ticket and try again.");
      }
      if (userCredits < approvedCost) throw new Error("Insufficient credits");

      const { data, error } = await supabase.rpc("approve_ticket_with_credits", {
        p_user_id: userId,
        p_ticket_id: ticketId,
        p_description: "Service ticket",
      });

      if (error) {
        console.error("approve_ticket_with_credits failed", error);
        throw error;
      }
      if (data === false) throw new Error("Insufficient credits");

      await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        from_status: "under_review",
        to_status: "approved",
        changed_by: userId,
        note: "Client approved proposal and paid.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-events", ticketId] });
      toast.success("Credits deducted! Ticket approved.");
    },
    onError: (e: Error) => toast.error(getUserFacingError(e, "Unable to process request")),
  });

  const cancelMutation = useMutation({
    mutationFn: async (currentStatus: string) => {
      if (!ticketId || !userId) throw new Error("Missing data");
      const { error } = await supabase.from("tickets").update({ status: "cancelled" }).eq("id", ticketId);
      if (error) throw error;
      await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        from_status: currentStatus,
        to_status: "cancelled",
        changed_by: userId,
        note: "Client cancelled the ticket.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Ticket cancelled.");
    },
    onError: (e: Error) => toast.error(getUserFacingError(e, "Unable to cancel")),
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { overall: number; timeliness?: number; value?: number; comment?: string }) => {
      if (!ticketId || !userId) throw new Error("Not authenticated");
      if (data.overall === 0) throw new Error("Please rate Overall quality.");
      const { error: rErr } = await supabase.from("ticket_reviews").insert({
        ticket_id: ticketId,
        user_id: userId,
        rating_overall: data.overall,
        rating_timeliness: data.timeliness || null,
        rating_value: data.value || null,
        comment: data.comment || null,
      });
      if (rErr) throw rErr;
      const { error: tErr } = await supabase.from("tickets").update({ status: "completed" }).eq("id", ticketId);
      if (tErr) throw tErr;
      await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        from_status: "uat",
        to_status: "completed",
        changed_by: userId,
        note: "Client confirmed work and submitted review.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-review", ticketId] });
      toast.success("Thank you for your review! Ticket completed.");
    },
    onError: (e: Error) => toast.error(getUserFacingError(e, "Unable to submit review")),
  });

  const requestChangesMutation = useMutation({
    mutationFn: async (feedback: string) => {
      if (!ticketId || !userId) throw new Error("Ticket not found");
      const cleanFeedback = feedback.trim();
      if (!cleanFeedback) throw new Error("Please add feedback");

      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .select("id, status, user_id")
        .eq("id", ticketId)
        .maybeSingle();

      if (ticketError) throw ticketError;
      if (!ticket) throw new Error("Ticket not found");
      if (ticket.user_id !== userId) throw new Error("Only the ticket owner can request changes.");
      if (ticket.status !== "uat") throw new Error("Ticket must be in UAT to request changes.");

      const { error: updateError } = await supabase.from("tickets").update({
        status: "in_progress",
        uat_feedback: cleanFeedback,
        updated_at: new Date().toISOString(),
      }).eq("id", ticketId);

      if (updateError) throw updateError;

      const { error: eventError } = await supabase.from("ticket_events").insert({
        ticket_id: ticketId,
        from_status: "uat",
        to_status: "in_progress",
        changed_by: userId,
        note: `Client requested changes after UAT: ${cleanFeedback}`,
      });

      if (eventError) throw eventError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-events", ticketId] });
      toast.success("Feedback sent. Ticket moved back to In Progress.");
    },
    onError: (e: Error) => toast.error(getUserFacingError(e, "Unable to request changes")),
  });

  return { approveMutation, cancelMutation, submitReviewMutation, requestChangesMutation };
}
