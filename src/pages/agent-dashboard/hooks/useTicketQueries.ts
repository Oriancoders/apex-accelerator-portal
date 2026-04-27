import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TicketDetailRow } from "../types";

export function useCompanyTickets(
  companyIds: string[],
  memberUserIds: string[],
  isConsultantRole: boolean,
  userId: string | undefined
) {
  return useQuery({
    queryKey: ["agent-company-tickets", companyIds, memberUserIds, userId, isConsultantRole],
    queryFn: async () => {
      if (!companyIds.length && !memberUserIds.length && !(isConsultantRole && userId)) return [];

      const filters: string[] = [];
      if (companyIds.length) filters.push(`company_id.in.(${companyIds.join(",")})`);
      if (memberUserIds.length) filters.push(`user_id.in.(${memberUserIds.join(",")})`);
      if (isConsultantRole && userId) filters.push(`assigned_consultant_id.eq.${userId}`);

      const { data, error } = await supabase
        .from("tickets")
        .select(
          "id, user_id, company_id, status, credit_cost, created_at, title, description, file_urls, priority, assigned_consultant_id, assignment_status"
        )
        // @ts-ignore
        .or(filters.join(","))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        return [];
      }
      return data || [];
    },
    enabled: companyIds.length > 0 || memberUserIds.length > 0 || (isConsultantRole && !!userId),
  });
}

export function useTicketDetails(ticketId: string | null) {
  return useQuery({
    queryKey: ["agent-ticket-details", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .maybeSingle();
      if (error) throw error;
      return (data || null) as TicketDetailRow | null;
    },
    enabled: !!ticketId,
  });
}
