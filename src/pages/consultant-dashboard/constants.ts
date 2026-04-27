export const ASSIGNMENT_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

export const TICKET_STATUSES = {
  SUBMITTED: "submitted",
  IN_PROGRESS: "in_progress",
  UAT: "uat",
  APPROVED: "approved",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const REQUEST_CHANGES_FROM_STATUS = "uat" as const;
export const REQUEST_CHANGES_TO_STATUS = "in_progress" as const;
