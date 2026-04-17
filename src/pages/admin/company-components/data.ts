export const COMPONENT_KEYS = [
  "ticket_submission",
  "ticket_overview",
  "knowledge_base",
  "recipes",
  "appexchange",
  "news",
  "extensions",
] as const;

export function labelFromKey(key: string): string {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
