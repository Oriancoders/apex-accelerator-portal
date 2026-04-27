import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConsultantTicket, CompanyRow, ProfileRow, TicketEventRow, TicketDetailRow } from "../types";
import { REQUEST_CHANGES_FROM_STATUS, REQUEST_CHANGES_TO_STATUS } from "../constants";

export function useAssignedTickets(userId: string | undefined) {
  return useQuery({
    queryKey: ["consultant-assigned-tickets", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select("id, user_id, company_id, status, credit_cost, created_at, title, description, file_urls, priority, assigned_consultant_id, assignment_status")
        .eq("assigned_consultant_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching consultant tickets:", error);
        return [];
      }

      return (data || []) as ConsultantTicket[];
    },
    enabled: !!userId,
  });
}

export function useProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ["consultant-ticket-profiles", userIds],
    queryFn: async () => {
      if (!userIds.length) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      if (error) {
        console.error("Error fetching consultant ticket profiles:", error);
        return [];
      }

      return (data || []) as ProfileRow[];
    },
    enabled: userIds.length > 0,
  });
}

export function useCompanies(companyIds: string[]) {
  return useQuery({
    queryKey: ["consultant-ticket-companies", companyIds],
    queryFn: async () => {
      if (!companyIds.length) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug")
        .in("id", companyIds);

      if (error) {
        console.error("Error fetching consultant ticket companies:", error);
        return [];
      }

      return (data || []) as CompanyRow[];
    },
    enabled: companyIds.length > 0,
  });
}

export function useRequestChangeEvents(ticketIds: string[]) {
  return useQuery({
    queryKey: ["consultant-request-changes-events", ticketIds],
    queryFn: async () => {
      if (!ticketIds.length) return [];

      const { data, error } = await supabase
        .from("ticket_events")
        .select("id, ticket_id, from_status, to_status, note, created_at")
        .in("ticket_id", ticketIds)
        .eq("from_status", REQUEST_CHANGES_FROM_STATUS)
        .eq("to_status", REQUEST_CHANGES_TO_STATUS)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching consultant request changes history:", error);
        return [];
      }

      return (data || []) as TicketEventRow[];
    },
    enabled: ticketIds.length > 0,
  });
}

export function useTicketDetails(ticketId: string | null) {
  return useQuery({
    queryKey: ["consultant-ticket-details", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase.from("tickets").select("*").eq("id", ticketId).maybeSingle();
      if (error) throw error;
      return (data || null) as TicketDetailRow | null;
    },
    enabled: !!ticketId,
  });
}
