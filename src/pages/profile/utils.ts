export function calculateStats(tickets: any[], transactions: any[], reviews: any[]) {
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter((t) => t.status === "completed").length;
  const activeTickets = tickets.filter((t) => !["completed", "cancelled"].includes(t.status)).length;
  const cancelledTickets = tickets.filter((t) => t.status === "cancelled").length;

  const totalHoursWorked = tickets.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const totalCreditsSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalCreditsPurchased = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating_overall || 0), 0) / reviews.length).toFixed(1)
    : "N/A";

  const ticketsByStatus = {
    submitted: tickets.filter((t) => t.status === "submitted").length,
    under_review: tickets.filter((t) => t.status === "under_review").length,
    approved: tickets.filter((t) => t.status === "approved").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    uat: tickets.filter((t) => t.status === "uat").length,
    completed: completedTickets,
    cancelled: cancelledTickets,
  };

  const ticketsByPriority = {
    low: tickets.filter((t) => t.priority === "low").length,
    medium: tickets.filter((t) => t.priority === "medium").length,
    high: tickets.filter((t) => t.priority === "high").length,
    critical: tickets.filter((t) => t.priority === "critical").length,
  };

  return {
    totalTickets, completedTickets, activeTickets, cancelledTickets,
    totalHoursWorked, totalCreditsSpent, totalCreditsPurchased, avgRating,
    ticketsByStatus, ticketsByPriority
  };
}

export function getMemberSince(createdAt?: string): string {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getInitials(fullName?: string): string {
  if (!fullName) return "U";
  return fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
