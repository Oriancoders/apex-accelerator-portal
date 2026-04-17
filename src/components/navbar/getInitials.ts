export function getInitials(fullName?: string | null) {
  if (!fullName) return "U";

  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
