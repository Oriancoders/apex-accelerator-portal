import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Bell } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { TYPE_ICONS, TYPE_COLORS } from "../constants";

interface NotificationCardProps {
  notification: any;
  index: number;
  onView: (notification: any) => void;
  onMarkRead: (id: string) => void;
}

export function NotificationCard({ notification: n, index, onView, onMarkRead }: NotificationCardProps) {
  const Icon = TYPE_ICONS[n.type] || Bell;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
    >
      <Card
        className={`rounded-ds-md transition-all duration-200 ${
          !n.is_read ? "border-primary/30 bg-primary/[0.03] shadow-sm" : "hover:bg-muted/30"
        }`}
      >
        <CardContent className="p-3 sm:p-4 flex items-start gap-3">
          <div className={`p-2 sm:p-2.5 rounded-ds-md ${TYPE_COLORS[n.type] || "bg-muted"} flex-shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm ${!n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                {n.title}
              </p>
              {!n.is_read && (
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary rounded-full">
                  New
                </Badge>
              )}
            </div>
            <p
              className={`text-sm mt-0.5 line-clamp-2 ${
                !n.is_read ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
              }`}
            >
              {n.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-lg text-xs"
            onClick={() => {
              onView(n);
              if (!n.is_read) {
                onMarkRead(n.id);
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
              onClick={() => onMarkRead(n.id)}
              title="Mark read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
