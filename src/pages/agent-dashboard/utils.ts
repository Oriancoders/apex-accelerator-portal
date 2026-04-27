import { supabase } from "@/integrations/supabase/client";

export function daysAgo(days: number): string {
  const d = new Date();
  if (days === 0) d.setHours(0, 0, 0, 0);
  else d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function fmtCredits(n: number | string | null | undefined): string {
  const val = Number(n);
  if (isNaN(val) || val === 0) return "0";

  return val.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function resolveTicketAttachmentUrl(rawPath: string): string {
  if (!rawPath) return "#";
  if (/^https?:\/\//i.test(rawPath)) return "#";
  const { data } = supabase.storage.from("ticket-attachments").getPublicUrl(rawPath);
  return data.publicUrl;
}

export function getAttachmentDisplayName(rawPath: string): string {
  if (!rawPath) return "Attachment";
  return rawPath.split("/").pop() || rawPath;
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
