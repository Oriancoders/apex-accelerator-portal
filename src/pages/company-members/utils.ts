import type { MembershipRow, ProfileRow } from "./types";

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

export function getAddableProfiles(allProfiles: ProfileRow[], memberUserIds: string[]): ProfileRow[] {
  const memberSet = new Set(memberUserIds);
  return allProfiles.filter((p) => !memberSet.has(p.user_id));
}

export function getOwnerCount(memberships: MembershipRow[]): number {
  return memberships.filter((m) => m.role === "owner").length;
}
