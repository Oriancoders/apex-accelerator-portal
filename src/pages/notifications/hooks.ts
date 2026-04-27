import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-page-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-notifications", userId] });
          queryClient.invalidateQueries({ queryKey: ["notification-bell", userId] });
          queryClient.invalidateQueries({ queryKey: ["notification-bell-count", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["user-notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!userId,
    refetchInterval: 15000,
  });

  return { notifications, isLoading };
}

export function useMarkAsReadMutation(userId?: string) {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell", userId] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell-count", userId] });
    },
  });

  return markReadMutation;
}

export function useMarkAllAsReadMutation(userId?: string) {
  const queryClient = useQueryClient();

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false)
        .eq("user_id", userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell", userId] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell-count", userId] });
    },
  });

  return markAllReadMutation;
}
