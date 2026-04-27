import { Button } from "@/components/ui/button";
import {
  PopoverContent,
} from "@/components/ui/popover";
import NotificationList from "@/components/notification-bell/NotificationList";
import type { NotificationItem } from "@/components/notification-bell/types";

type NotificationPopoverContentProps = {
  unreadCount: number;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onOpenDetails: (notification: NotificationItem) => void;
  onMarkAllRead: () => void;
  isMarkingAllRead: boolean;
  onViewAll: () => void;
};

export default function NotificationPopoverContent({
  unreadCount,
  notifications,
  onMarkRead,
  onOpenDetails,
  onMarkAllRead,
  isMarkingAllRead,
  onViewAll,
}: NotificationPopoverContentProps) {
  return (
    <PopoverContent align="end" sideOffset={8} className="w-[calc(100vw-2rem)] max-w-sm p-0 rounded-ds-md">
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isMarkingAllRead}
                className="h-7 px-2 rounded-md text-[11px]"
                onClick={onMarkAllRead}
              >
                {isMarkingAllRead ? "Marking..." : "Mark all read"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        <NotificationList notifications={notifications} onMarkRead={onMarkRead} onOpenDetails={onOpenDetails} />
      </div>

      <div className="px-4 py-2.5 border-t border-border-subtle">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-9 rounded-lg text-xs font-medium text-primary hover:text-primary"
          onClick={onViewAll}
        >
          View All Notifications
        </Button>
      </div>
    </PopoverContent>
  );
}
