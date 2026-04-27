import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type WebhookPayload = {
  type?: "INSERT" | "UPDATE" | "DELETE" | string;
  table?: string;
  record?: unknown;
};

type TicketRecord = {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  user_id: string;
};

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyWebhookSignature(req: Request, rawBody: string, secret: string) {
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signatureHeader = req.headers.get("x-webhook-signature") ?? "";
  const signature = signatureHeader.startsWith("v1=") ? signatureHeader.slice(3) : signatureHeader;

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );

  return timingSafeEqual(bytesToHex(digest), signature.toLowerCase());
}

function formatStatus(status: string): string {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ticketEmailTemplate(args: {
  recipientName: string;
  ticketTitle: string;
  ticketId: string;
  status: string;
  isNew: boolean;
  priority?: string | null;
}) {
  const safeTitle = escapeHtml(args.ticketTitle);
  const safeName = escapeHtml(args.recipientName);
  const statusFormatted = escapeHtml(formatStatus(args.status));
  const heading = args.isNew ? "New Ticket Submitted" : "Ticket Status Updated";
  const message = args.isNew
    ? `Your ticket "<strong>${safeTitle}</strong>" has been submitted successfully. Our team will review it shortly.`
    : `The status of your ticket "<strong>${safeTitle}</strong>" has been updated to <strong>${statusFormatted}</strong>.`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#1a1a2e;padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Customer Connect</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:18px;">${heading}</h2>
      <p style="color:#71717a;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Hi ${safeName},<br/><br/>
        ${message}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 14px;background:#f4f4f5;border-radius:8px 8px 0 0;font-size:12px;color:#71717a;font-weight:600;">TICKET</td>
          <td style="padding:10px 14px;background:#f4f4f5;border-radius:8px 8px 0 0;font-size:13px;color:#1a1a2e;font-weight:600;">${safeTitle}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;border-bottom:1px solid #f4f4f5;">STATUS</td>
          <td style="padding:10px 14px;font-size:13px;color:#1a1a2e;border-bottom:1px solid #f4f4f5;">${statusFormatted}</td>
        </tr>
        ${
          args.priority
            ? `<tr>
          <td style="padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;">PRIORITY</td>
          <td style="padding:10px 14px;font-size:13px;color:#1a1a2e;text-transform:capitalize;">${escapeHtml(args.priority)}</td>
        </tr>`
            : ""
        }
      </table>
      <p style="color:#a1a1aa;font-size:12px;margin:0;">
        You can track your ticket progress in the Customer Connect portal.
      </p>
    </div>
    <div style="background:#f4f4f5;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} Customer Connect. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!apiKey) return;

  const from = Deno.env.get("RESEND_FROM") ?? "Customer Connect <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("resend-webhook: Resend error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
  const supabaseAdmin = createClient(supabaseUrl, serviceRole);

  try {
    if (!webhookSecret) {
      console.error("resend-webhook: RESEND_WEBHOOK_SECRET is not configured");
      return new Response(JSON.stringify({ error: "Webhook is not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const signatureOk = await verifyWebhookSignature(req, rawBody, webhookSecret);
    if (!signatureOk) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const forwardedFor = req.headers.get("x-forwarded-for") || "unknown";
    const sourceKey = forwardedFor.split(",")[0].trim() || "unknown";

    const { data: rlData, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
      p_key: `resend-webhook:${sourceKey}`,
      p_window_seconds: 60,
      p_max_requests: 120,
    });

    if (rlError) {
      console.error("resend-webhook rate-limit error:", rlError);
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(rlData as any)?.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;
    const { type, table, record } = payload ?? {};

    if (!type || !table || !record) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (table !== "tickets") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ticket = record as TicketRecord;
    if (!ticket.user_id || !ticket.title || !ticket.id) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isNew = type === "INSERT";

    const [userRes, rolesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("email,full_name").eq("user_id", ticket.user_id).maybeSingle(),
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin"),
    ]);

    if (userRes.error) throw userRes.error;
    if (rolesRes.error) throw rolesRes.error;

    const userEmail = (userRes.data as any)?.email as string | null | undefined;
    const userName = ((userRes.data as any)?.full_name as string | null | undefined) ?? "User";

    const adminUserIds = ((rolesRes.data as any[]) ?? [])
      .map((r) => (r as any)?.user_id as string | undefined)
      .filter(Boolean) as string[];

    const { data: adminProfiles, error: adminProfilesError } = adminUserIds.length
      ? await supabaseAdmin.from("profiles").select("email").in("user_id", adminUserIds)
      : { data: [], error: null };
    if (adminProfilesError) throw adminProfilesError;

    const adminEmails = ((adminProfiles as any[]) ?? [])
      .map((p) => (p as any)?.email as string | null | undefined)
      .filter(Boolean) as string[];

    const safeTitle = (ticket.title || "").slice(0, 200);
    const subject = isNew
      ? `New Ticket: ${safeTitle}`
      : `Ticket Updated: ${safeTitle} → ${formatStatus(ticket.status)}`;

    const emailPromises: Promise<void>[] = [];

    if (userEmail) {
      emailPromises.push(
        sendEmail([userEmail], subject, ticketEmailTemplate({
          recipientName: userName,
          ticketTitle: safeTitle,
          ticketId: ticket.id,
          status: ticket.status,
          isNew,
          priority: ticket.priority ?? null,
        })),
      );
    }

    const adminRecipients = adminEmails.filter((e) => e && e !== userEmail);
    if (adminRecipients.length > 0) {
      emailPromises.push(
        sendEmail(adminRecipients, subject, ticketEmailTemplate({
          recipientName: "Admin",
          ticketTitle: safeTitle,
          ticketId: ticket.id,
          status: ticket.status,
          isNew,
          priority: ticket.priority ?? null,
        })),
      );
    }

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("resend-webhook error:", error);
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
