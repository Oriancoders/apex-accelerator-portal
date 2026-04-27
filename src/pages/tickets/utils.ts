import { isActiveStatus } from "@/constants/ticket";

export function filterTickets(tickets: any[], filter: string) {
  if (filter === "active") return tickets.filter((t) => isActiveStatus(t.status));
  if (filter === "completed") return tickets.filter((t) => t.status === "completed");
  if (filter === "cancelled") return tickets.filter((t) => t.status === "cancelled");
  return tickets;
}

export function getTicketPaths(role?: string, activeCompanySlug?: string) {
  const ticketListPath =
    (role === "company_admin" || role === "member") && activeCompanySlug
      ? `/${activeCompanySlug}/tickets`
      : "/tickets";
  const newTicketPath =
    (role === "company_admin" || role === "member") && activeCompanySlug
      ? `/${activeCompanySlug}/tickets/new`
      : "/tickets/new";
  return { ticketListPath, newTicketPath };
}
