import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_ACTION } from "@/constants/ticket";
import type { TicketType } from "@/pages/admin/tickets/types";

export function useAdminTicketsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const realtimeBadgeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [realtimePulse, setRealtimePulse] = useState(false);

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      return (data || []) as TicketType[];
    },
  });

  useEffect(() => {
    const pulse = () => {
      setRealtimePulse(true);
      if (realtimeBadgeRef.current) clearTimeout(realtimeBadgeRef.current);
      realtimeBadgeRef.current = setTimeout(() => setRealtimePulse(false), 2000);
    };

    const ticketsSub = supabase
      .channel("admin-tickets-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tickets" }, (payload) => {
        const newTicket = payload.new as TicketType;
        queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        toast("🎫 New ticket submitted", {
          description: newTicket.title,
          duration: 8000,
          action: {
            label: "View",
            onClick: () => navigate(`/admin/tickets/${newTicket.id}`),
          },
        });
        pulse();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tickets" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        pulse();
      })
      .subscribe();

    const reviewsSub = supabase
      .channel("admin-ticket-reviews-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_reviews" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        pulse();
      })
      .subscribe();

    const creditsSub = supabase
      .channel("admin-credit-transactions-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "credit_transactions" }, (payload) => {
        const record = payload.new as { type: string; amount: number };
        queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        if (record.type === "purchase" && record.amount > 0) {
          toast.success(`💳 Credit purchase: +${record.amount} credits`, {
            description: "A user just purchased credits.",
            duration: 5000,
          });
        }
        pulse();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsSub);
      supabase.removeChannel(reviewsSub);
      supabase.removeChannel(creditsSub);
      if (realtimeBadgeRef.current) clearTimeout(realtimeBadgeRef.current);
    };
  }, [navigate, queryClient]);

  const filtered = tickets.filter((ticket) => {
    const matchSearch =
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: tickets.length,
    action: tickets.filter((ticket) => STATUS_ACTION[ticket.status]?.urgent).length,
    submitted: tickets.filter((ticket) => ticket.status === "submitted").length,
    in_progress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    uat: tickets.filter((ticket) => ticket.status === "uat").length,
    completed: tickets.filter((ticket) => ticket.status === "completed").length,
  };

  const refreshAndSyncSelected = async () => {
    queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    await refetch();
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    realtimePulse,
    isLoading,
    tickets,
    filtered,
    counts,
    refreshAndSyncSelected,
  };
}
