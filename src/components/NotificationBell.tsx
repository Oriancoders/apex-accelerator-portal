import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notification-bell"] });
    queryClient.invalidateQueries({ queryKey: ["notification-bell-count"] });
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-unread-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
  }, [queryClient]);

  // Realtime subscription for current user's notifications only
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notification-bell-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          invalidateAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, invalidateAll]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notification-bell", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notification-bell-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("user_id", user.id);

      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user.id);
    },
    onSuccess: invalidateAll,
  });

  // Auto-mark all visible notifications as read when popover opens
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current && notifications.length > 0) {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length > 0 && user) {
        const markAll = async () => {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", unreadIds)
            .eq("user_id", user.id);
        };
        setTimeout(markAll, 1500);
      }
    }
    prevOpen.current = open;
  }, [open, notifications, user]);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] flex items-center justify-center rounded-full text-[10px] px-1 font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 sm:w-96 p-0 rounded-xl">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-border last:border-0 flex items-start gap-3 transition-colors ${
                  !n.is_read ? "bg-primary/[0.03]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    {format(new Date(n.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md flex-shrink-0 mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate(n.id);
                    }}
                    title="Mark read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-9 rounded-lg text-xs font-medium text-primary hover:text-primary"
            onClick={() => {
              setOpen(false);
              navigate(isAdmin ? "/admin/notifications" : "/notifications");
            }}
          >
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
