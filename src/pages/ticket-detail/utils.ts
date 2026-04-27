import { supabase } from "@/integrations/supabase/client";

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

export function plainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}
