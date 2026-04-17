import type { TicketStage, TicketStatus } from "@/components/path-tracker/types";

export const stages: TicketStage[] = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "in_progress", label: "In Progress" },
  { key: "uat", label: "UAT" },
  { key: "completed", label: "Completed" },
];

export const statusIndex: Record<TicketStatus, number> = {
  submitted: 0,
  under_review: 1,
  approved: 2,
  in_progress: 3,
  uat: 4,
  completed: 5,
  closed: 5,
  cancelled: -1,
};
