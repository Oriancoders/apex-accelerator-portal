import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface TicketRecord {
  id: string;
  title: string;
  status: string;
  priority: string;
  user_id: string;
  contact_email?: string;
  credit_cost?: number;
  description?: string;
}

async function getUserEmail(userId: string): Promise<{ email: string; name: string } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=email,full_name`, {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });
  const data = await res.json();
  if (data && data.length > 0) {
    return { email: data[0].email, name: data[0].full_name || "User" };
  }
  return null;
}

async function getAdminEmails(): Promise<string[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const rolesRes = await fetch(`${supabaseUrl}/rest/v1/user_roles?role=eq.admin&select=user_id`, {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });
  const roles = await rolesRes.json();
  if (!roles || roles.length === 0) return [];

  const adminUserIds = roles.map((r: any) => r.user_id);
  const emails: string[] = [];

  for (const uid of adminUserIds) {
    const user = await getUserEmail(uid);
    if (user?.email) emails.push(user.email);
  }
  return emails;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function sendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SF Services <notifications@sfservices.com>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
  }
}

function ticketEmailTemplate(
  recipientName: string,
  ticketTitle: string,
  ticketId: string,
  status: string,
  isNew: boolean,
  priority?: string,
): string {
  const statusFormatted = formatStatus(status);
  const heading = isNew ? "New Ticket Submitted" : "Ticket Status Updated";
  const message = isNew
    ? `Your ticket "<strong>${ticketTitle}</strong>" has been submitted successfully. Our team will review it shortly.`
    : `The status of your ticket "<strong>${ticketTitle}</strong>" has been updated to <strong>${statusFormatted}</strong>.`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#1a1a2e;padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">☁️ SF Services</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:18px;">${heading}</h2>
      <p style="color:#71717a;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Hi ${recipientName},<br/><br/>
        ${message}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 14px;background:#f4f4f5;border-radius:8px 8px 0 0;font-size:12px;color:#71717a;font-weight:600;">TICKET</td>
          <td style="padding:10px 14px;background:#f4f4f5;border-radius:8px 8px 0 0;font-size:13px;color:#1a1a2e;font-weight:600;">${ticketTitle}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;border-bottom:1px solid #f4f4f5;">STATUS</td>
          <td style="padding:10px 14px;font-size:13px;color:#1a1a2e;border-bottom:1px solid #f4f4f5;">${statusFormatted}</td>
        </tr>
        ${priority ? `<tr>
          <td style="padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;">PRIORITY</td>
          <td style="padding:10px 14px;font-size:13px;color:#1a1a2e;text-transform:capitalize;">${priority}</td>
        </tr>` : ""}
      </table>
      <p style="color:#a1a1aa;font-size:12px;margin:0;">
        You can track your ticket progress in the SF Services portal.
      </p>
    </div>
    <div style="background:#f4f4f5;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} SF Services. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, table, record } = payload;

    if (table !== "tickets" || !record) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ticket = record as TicketRecord;
    const isNew = type === "INSERT";

    // Get ticket owner info
    const user = await getUserEmail(ticket.user_id);
    const adminEmails = await getAdminEmails();

    const subject = isNew
      ? `New Ticket: ${ticket.title}`
      : `Ticket Updated: ${ticket.title} → ${formatStatus(ticket.status)}`;

    // Send to user
    if (user?.email) {
      await sendEmail(
        [user.email],
        subject,
        ticketEmailTemplate(user.name, ticket.title, ticket.id, ticket.status, isNew, ticket.priority),
      );
    }

    // Send to admins (exclude the user if they're also an admin)
    const adminRecipients = adminEmails.filter((e) => e !== user?.email);
    if (adminRecipients.length > 0) {
      await sendEmail(
        adminRecipients,
        subject,
        ticketEmailTemplate("Admin", ticket.title, ticket.id, ticket.status, isNew, ticket.priority),
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
