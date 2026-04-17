import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import NotificationPopoverContent from "@/components/notification-bell/NotificationPopoverContent";
import NotificationTriggerButton from "@/components/notification-bell/NotificationTriggerButton";
import { useNotificationBell } from "@/components/notification-bell/useNotificationBell";
import NotificationTicketDialog from "@/components/notification-bell/NotificationTicketDialog";
import type { NotificationItem } from "@/components/notification-bell/types";

export default function NotificationBell() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  const { notifications, unreadCount, markRead, markAllRead, isMarkingAllRead } = useNotificationBell({
    userId: user?.id,
    open,
  });

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <NotificationTriggerButton unreadCount={unreadCount} />
      </PopoverTrigger>
      <NotificationPopoverContent
        unreadCount={unreadCount}
        notifications={notifications}
        onMarkRead={markRead}
        onOpenDetails={(notification) => {
          setSelectedNotification(notification);
          setOpenDetails(true);
          setOpen(false);
          if (!notification.is_read) {
            markRead(notification.id);
          }
        }}
        onMarkAllRead={markAllRead}
        isMarkingAllRead={isMarkingAllRead}
        onViewAll={() => {
          setOpen(false);
          navigate(isAdmin ? "/admin/notifications" : "/notifications");
        }}
      />

      <NotificationTicketDialog
        open={openDetails}
        onOpenChange={setOpenDetails}
        ticketId={selectedNotification?.ticket_id}
        notificationUserId={selectedNotification?.user_id}
        notificationType={selectedNotification?.type}
        notificationCreatedAt={selectedNotification?.created_at}
        notificationTitle={selectedNotification?.title || "Notification"}
        notificationMessage={selectedNotification?.message || ""}
        isAdmin={isAdmin}
      />
    </Popover>
  );
}
