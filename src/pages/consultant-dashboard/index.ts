export { default as ConsultantDashboardPage } from "./ConsultantDashboardPage";
export { TicketsTable } from "./components/TicketsTable";
export { TicketDetailsDialog } from "./components/TicketDetailsDialog";
export { useAssignedTickets, useProfiles, useCompanies, useRequestChangeEvents, useTicketDetails } from "./hooks/useConsultantDashboardQueries";
export { useRespondAssignmentMutation, useSendToUatMutation } from "./hooks/useConsultantDashboardMutations";
export { fmtCredits, resolveTicketAttachmentUrl, getAttachmentDisplayName, plainText } from "./utils";
export type { ConsultantTicket, CompanyRow, ProfileRow, TicketEventRow, TicketDetailRow } from "./types";
