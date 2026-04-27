import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import NotificationTicketDialog from "@/components/notification-bell/NotificationTicketDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useNotifications, useMarkAsReadMutation, useMarkAllAsReadMutation } from "./hooks";
import { NotificationCard } from "./components/NotificationCard";
import { FILTER_TYPES } from "./constants";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, isLoading } = useNotifications(user?.id);
  const markReadMutation = useMarkAsReadMutation(user?.id);
  const markAllReadMutation = useMarkAllAsReadMutation(user?.id);

  const [filter, setFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  const handleMarkAll = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
    });
  };

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
              onClick={handleMarkAll}
              className="gap-1.5 h-10 rounded-ds-md self-start sm:self-auto"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTER_TYPES.map((t) => (
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
            {filtered.map((n, i) => (
              <NotificationCard
                key={n.id}
                notification={n}
                index={i}
                onView={(notification) => {
                  setSelectedNotification(notification);
                  setOpenDetails(true);
                }}
                onMarkRead={(id) => markReadMutation.mutate(id)}
              />
            ))}
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
