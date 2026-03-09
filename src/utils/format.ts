/**
 * Shared formatting utilities.
 */

/** Format a minute-based duration into a human-readable short form. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / (60 * 24))}d`;
}
