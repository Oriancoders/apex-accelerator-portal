import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { NotificationItem } from "@/components/notification-bell/types";

type UseNotificationBellParams = {
  userId?: string;
  open: boolean;
};

export function useNotificationBell({ userId, open }: UseNotificationBellParams) {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notification-bell"] });
    queryClient.invalidateQueries({ queryKey: ["notification-bell-count"] });
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-unread-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
  }, [queryClient]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notification-bell-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          invalidateAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, invalidateAll]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notification-bell", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data } = await supabase
        .from("notifications")
        .select("id, user_id, type, title, message, ticket_id, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      return (data || []) as NotificationItem[];
    },
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notification-bell-count", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("user_id", userId);

      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
    onError: () => {
      toast.error("Unable to mark notification as read right now.");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("All notifications marked as read.");
    },
    onError: () => {
      toast.error("Unable to mark all notifications as read right now.");
    },
  });

  return {
    notifications,
    unreadCount,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
