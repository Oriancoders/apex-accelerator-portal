import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"tickets">;

export function useTicketsList(userId?: string, role?: string, activeCompanyId?: string) {
  const isCompanyContext = (role === "company_admin" || role === "member") && !!activeCompanyId;
  const isCompanyAdminView = role === "company_admin" && !!activeCompanyId;

  return useQuery({
    queryKey: ["tickets", userId, role, activeCompanyId],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (isCompanyContext && activeCompanyId) {
        query = query.eq("company_id", activeCompanyId);
        if (!isCompanyAdminView) {
          query = query.eq("user_id", userId);
        }
      } else {
        query = query.eq("user_id", userId);
      }

      const { data } = await query;
      return (data || []) as Ticket[];
    },
    enabled: !!userId,
  });
}

export function useRealtimeTickets(
  userId?: string,
  role?: string,
  activeCompanyId?: string
) {
  const queryClient = useQueryClient();
  const [realtimePulse, setRealtimePulse] = useState(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef<Record<string, string>>({});

  const pulse = useCallback(() => {
    setRealtimePulse(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setRealtimePulse(false), 2000);
  }, []);

  const isCompanyContext = (role === "company_admin" || role === "member") && !!activeCompanyId;
  const isCompanyAdminView = role === "company_admin" && !!activeCompanyId;

  useEffect(() => {
    if (!userId) return;

    const realtimeFilter = isCompanyContext && activeCompanyId
      ? isCompanyAdminView
        ? `company_id=eq.${activeCompanyId}`
        : `user_id=eq.${userId}`
      : `user_id=eq.${userId}`;

    const channel = supabase
      .channel("client-tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: realtimeFilter },
        (payload) => {
          const updated = payload.new as Ticket | undefined;
          if (updated && payload.eventType === "UPDATE") {
            const prev = prevStatusRef.current[updated.id];
            if (prev && prev !== updated.status) {
              const statusLabel = updated.status.replace(/_/g, " ");
              toast.info(`Ticket status updated to "${statusLabel}"`, {
                description: updated.title,
                duration: 5000,
              });
            }
            prevStatusRef.current[updated.id] = updated.status;
          }
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
          pulse();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [userId, queryClient, pulse, isCompanyContext, isCompanyAdminView, activeCompanyId]);

  return { realtimePulse, prevStatusRef };
}
