import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import NotificationTicketDialog from "@/components/notification-bell/NotificationTicketDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, RefreshCw, Ticket } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

const typeIcons: Record<string, typeof Bell> = {
  new_ticket: Ticket,
  ticket_status_change: RefreshCw,
  proposal_submitted: Ticket,
};

const typeColors: Record<string, string> = {
  new_ticket: "bg-primary/10 text-primary",
  ticket_status_change: "bg-accent/10 text-accent",
  proposal_submitted: "bg-primary/10 text-primary",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-page-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notification-bell", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notification-bell-count", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["user-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell-count", user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notification-bell-count", user?.id] });
      toast.success("All notifications marked as read");
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filterTypes = ["all", "new_ticket", "ticket_status_change"];
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <ProtectedLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="gap-1.5 h-10 rounded-xl self-start sm:self-auto"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {filterTypes.map((t) => (
            <Button
              key={t}
              variant={filter === t ? "default" : "outline"}
              size="sm"
              className="rounded-full h-9 px-4 text-xs sm:text-sm"
              onClick={() => setFilter(t)}
            >
              {t === "all" ? "All" : t.replace(/_/g, " ")}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="text-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((n, i) => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                >
                  <Card className={`rounded-xl transition-all duration-200 ${!n.is_read ? "border-primary/30 bg-primary/[0.03] shadow-sm" : "hover:bg-muted/30"}`}>
                    <CardContent className="p-3 sm:p-4 flex items-start gap-3">
                      <div className={`p-2 sm:p-2.5 rounded-xl ${typeColors[n.type] || "bg-muted"} flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm ${!n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>{n.title}</p>
                          {!n.is_read && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary rounded-full">New</Badge>}
                        </div>
                          <p className={`text-sm mt-0.5 line-clamp-2 ${!n.is_read ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}`}>{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-lg text-xs"
                        onClick={() => {
                          setSelectedNotification(n);
                          setOpenDetails(true);
                          if (!n.is_read) {
                            markReadMutation.mutate(n.id);
                          }
                        }}
                      >
                        View
                      </Button>
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg flex-shrink-0"
                          onClick={() => markReadMutation.mutate(n.id)}
                          title="Mark read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <NotificationTicketDialog
          open={openDetails}
          onOpenChange={setOpenDetails}
          ticketId={selectedNotification?.ticket_id}
          notificationUserId={selectedNotification?.user_id}
          notificationType={selectedNotification?.type}
          notificationCreatedAt={selectedNotification?.created_at}
          notificationTitle={selectedNotification?.title || "Notification"}
          notificationMessage={selectedNotification?.message || ""}
          isAdmin={false}
        />
      </div>
    </ProtectedLayout>
  );
}
