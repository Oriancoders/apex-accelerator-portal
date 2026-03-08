import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, User, Ticket, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const typeIcons: Record<string, typeof Bell> = {
  signup: User,
  login: User,
  guest_session: User,
  new_ticket: Ticket,
  ticket_status_change: RefreshCw,
  proposal_submitted: Ticket,
};

const typeColors: Record<string, string> = {
  signup: "bg-success/10 text-success",
  login: "bg-info/10 text-info",
  guest_session: "bg-warning/10 text-warning",
  new_ticket: "bg-primary/10 text-primary",
  ticket_status_change: "bg-accent/10 text-accent",
  proposal_submitted: "bg-primary/10 text-primary",
};

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

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
  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "signup", "new_ticket", "ticket_status_change", "login"].map((t) => (
          <Button key={t} variant={filter === t ? "default" : "outline"} size="sm" onClick={() => setFilter(t)}>
            {t === "all" ? "All" : t.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            No notifications
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <Card key={n.id} className={`transition-colors ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-full ${typeColors[n.type] || "bg-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {!n.is_read && <Badge variant="outline" className="text-xs bg-primary/10 text-primary">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" size="icon" onClick={() => markReadMutation.mutate(n.id)} title="Mark read">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
