import type { MembershipRow, ProfileRow } from "./types";
import { OPEN_TICKET_STATUSES } from "./constants";

export function buildProfileByUserIdMap(profiles: ProfileRow[]): Record<string, ProfileRow> {
  const map: Record<string, ProfileRow> = {};
  profiles.forEach((p) => {
    map[p.user_id] = p;
  });
  return map;
}

export function getMemberUserIds(memberships: MembershipRow[]): string[] {
  return memberships.map((m) => m.user_id);
}

export function getOwnerCount(memberships: MembershipRow[]): number {
  return memberships.filter((m) => m.role === "owner").length;
}

export function calculateTicketStats(tickets: any[]) {
  const open = tickets.filter((t) =>
    OPEN_TICKET_STATUSES.includes(t.status as any)
  );
  return { total: tickets.length, open: open.length };
}
