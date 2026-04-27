import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import NotificationTicketDialog from "@/components/notification-bell/NotificationTicketDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, User, Ticket, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

const typeIcons: Record<string, typeof Bell> = {
  signup: User,
  login: User,
  guest_session: User,
  new_ticket: Ticket,
  ticket_status_change: RefreshCw,
  proposal_submitted: Ticket,
};

const typeColors: Record<string, string> = {
  signup: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  login: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
  guest_session: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  new_ticket: "bg-primary/10 text-primary",
  ticket_status_change: "bg-accent/10 text-accent",
  proposal_submitted: "bg-primary/10 text-primary",
};

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filterTypes = ["all", "signup", "new_ticket", "ticket_status_change", "login"];
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <AdminLayout>
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
              className="gap-1.5 h-10 rounded-ds-md self-start sm:self-auto"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Hick's Law: Filter chips reduce scanning — Fitts's Law: large pill targets */}
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
          <Card className="rounded-ds-xl">
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
                  <Card className={`rounded-ds-md transition-all duration-200 ${!n.is_read ? "border-primary/30 bg-primary/[0.03] shadow-sm" : "hover:bg-muted/30"}`}>
                    {/* Fitts's Law: Generous padding for touch targets */}
                    <CardContent className="p-3 sm:p-4 flex items-start gap-3">
                      <div className={`p-2 sm:p-2.5 rounded-ds-md ${typeColors[n.type] || "bg-muted"} flex-shrink-0`}>
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
          isAdmin
        />
      </div>
    </AdminLayout>
  );
}
