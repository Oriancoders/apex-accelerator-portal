export const PERIODS = [
  { label: "Today", days: 0 },
  { label: "3 Days", days: 3 },
  { label: "7 Days", days: 7 },
  { label: "1 Month", days: 30 },
] as const;

export const TICKET_OPEN_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "in_progress",
  "uat"
] as const;

export const TICKET_RESOLVED_STATUSES = [
  "resolved",
  "completed"
] as const;
