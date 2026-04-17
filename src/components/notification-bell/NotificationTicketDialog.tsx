import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Link as LinkIcon, Ticket, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NotificationTicketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string | null;
  notificationUserId?: string | null;
  notificationType?: string;
  notificationCreatedAt?: string;
  notificationTitle: string;
  notificationMessage: string;
  isAdmin?: boolean;
};

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function NotificationTicketDialog({
  open,
  onOpenChange,
  ticketId,
  notificationUserId,
  notificationType,
  notificationCreatedAt,
  notificationTitle,
  notificationMessage,
  isAdmin = false,
}: NotificationTicketDialogProps) {
  const navigate = useNavigate();

  const ticketPath = useMemo(() => {
    if (!ticketId) return "";
    return isAdmin ? `/admin/tickets/${ticketId}` : `/tickets/${ticketId}`;
  }, [isAdmin, ticketId]);

  const { data } = useQuery({
    queryKey: ["notification-ticket", ticketId],
    enabled: open,
    queryFn: async () => {
      let ticket: {
        id: string;
        title: string;
        status: string;
        priority: string;
        description: string;
        created_at: string;
        contact_email: string | null;
        contact_phone: string | null;
        user_id: string;
      } | null = null;

      let profileUserId = notificationUserId || null;

      if (ticketId) {
        const { data: ticketData } = await supabase
          .from("tickets")
          .select("id,title,status,priority,description,created_at,contact_email,contact_phone,user_id")
          .eq("id", ticketId)
          .maybeSingle();

        ticket = (ticketData as typeof ticket) ?? null;
        profileUserId = ticket?.user_id || profileUserId;
      }

      let profile: {
        full_name: string | null;
        email: string | null;
        phone: string | null;
        company: string | null;
      } | null = null;

      if (profileUserId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name,email,phone,company")
          .eq("user_id", profileUserId)
          .maybeSingle();
        profile = (profileData as typeof profile) ?? null;
      }

      return { ticket, profile };
    },
  });

  const ticket = data?.ticket || null;
  const profile = data?.profile || null;

  const description = ticket?.description ? stripHtml(ticket.description) : "";

  const notificationReason = useMemo(() => {
    const reasonByType: Record<string, string> = {
      signup: "A new user account was created in the portal.",
      login: "A user login event was detected.",
      guest_session: "A guest session activity was created.",
      new_ticket: "A new ticket was submitted and needs attention.",
      ticket_status_change: "A ticket status changed, so this update was sent.",
      proposal_submitted: "A proposal was submitted for review.",
    };

    if (notificationType && reasonByType[notificationType]) {
      return reasonByType[notificationType];
    }

    return notificationMessage || "This event triggered a system notification.";
  }, [notificationMessage, notificationType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            {notificationTitle}
          </DialogTitle>
          <DialogDescription>{notificationMessage}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Why this notification came</p>
            <p className="text-sm text-foreground">{notificationReason}</p>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              {notificationType ? <span className="capitalize">Type: {notificationType.replace(/_/g, " ")}</span> : null}
              {notificationCreatedAt ? <span>{format(new Date(notificationCreatedAt), "MMM d, yyyy h:mm a")}</span> : null}
            </div>
          </div>

          {(profile || ticket?.contact_email || ticket?.contact_phone) ? (
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" />
                Requester Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {profile?.full_name || "Not available"}</p>
                <p><span className="text-muted-foreground">Email:</span> {profile?.email || ticket?.contact_email || "Not available"}</p>
                <p><span className="text-muted-foreground">Company:</span> {profile?.company || "Not available"}</p>
                <p><span className="text-muted-foreground">Contact:</span> {ticket?.contact_phone || profile?.phone || "Not available"}</p>
              </div>
            </div>
          ) : null}

          {ticketId ? (
            <>
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">{ticket?.title || "Ticket"}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {ticket?.status && <Badge variant="outline" className="rounded-full text-[11px]">{ticket.status}</Badge>}
                {ticket?.priority && <Badge variant="secondary" className="rounded-full text-[11px] capitalize">{ticket.priority}</Badge>}
                {ticket?.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-4">{description}</p>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
              <LinkIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Ticket URL</p>
                <p className="text-xs font-medium text-foreground break-all">{ticketPath}</p>
              </div>
            </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">This notification has no linked ticket.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {ticketId && (
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate(ticketPath);
              }}
              className="gap-1.5"
            >
              Open Ticket
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
