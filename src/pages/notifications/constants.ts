import { Ticket, RefreshCw, Bell } from "lucide-react";

export const TYPE_ICONS: Record<string, typeof Bell> = {
  new_ticket: Ticket,
  ticket_status_change: RefreshCw,
  proposal_submitted: Ticket,
};

export const TYPE_COLORS: Record<string, string> = {
  new_ticket: "bg-primary/10 text-primary",
  ticket_status_change: "bg-accent/10 text-accent",
  proposal_submitted: "bg-primary/10 text-primary",
};

export const FILTER_TYPES = ["all", "new_ticket", "ticket_status_change"];
