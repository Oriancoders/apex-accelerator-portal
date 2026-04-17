import { forwardRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotificationTriggerButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
  unreadCount: number;
};

const NotificationTriggerButton = forwardRef<HTMLButtonElement, NotificationTriggerButtonProps>(
  ({ unreadCount, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={`relative h-10 w-10 rounded-full ${className || ""}`}
        {...props}
      >
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
    );
  }
);

NotificationTriggerButton.displayName = "NotificationTriggerButton";

export default NotificationTriggerButton;
