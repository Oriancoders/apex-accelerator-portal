import { supabase } from "@/integrations/supabase/client";

export function fmtCredits(n: number | string | null | undefined): string {
  const val = Number(n);
  if (Number.isNaN(val) || val === 0) return "0";
  return val.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

export function plainText(html: string | null | undefined): string {
  return html?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "No description";
}
