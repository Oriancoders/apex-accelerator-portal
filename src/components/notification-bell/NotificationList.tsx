import { Bell, Check } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/components/notification-bell/types";

type NotificationListProps = {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onOpenDetails: (notification: NotificationItem) => void;
};

export default function NotificationList({ notifications, onMarkRead, onOpenDetails }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center">
        <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <>
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`px-4 py-3 border-b border-border-subtle last:border-0 flex items-start gap-3 transition-colors ${
            !n.is_read ? "bg-primary/[0.03]" : ""
          } cursor-pointer hover:bg-muted/40`}
          onClick={() => onOpenDetails(n)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm truncate ${!n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>{n.title}</p>
              {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
            </div>
            <p className={`text-xs mt-0.5 line-clamp-2 ${!n.is_read ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}`}>{n.message}</p>
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
                onMarkRead(n.id);
              }}
              title="Mark read"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </>
  );
}
