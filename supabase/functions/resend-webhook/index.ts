import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}&select=email,full_name`, {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return { email: data[0].email, name: data[0].full_name || "User" };
    }
  } catch (err) {
    console.error("getUserEmail failed:", err instanceof Error ? err.message : err);
  }
  return null;
}

/**
 * PERFORMANCE FIX: Batch-fetch admin emails in a single query
 * instead of N+1 individual profile lookups.
 */
async function getAdminEmails(): Promise<string[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Step 1: Get admin user IDs
    const rolesRes = await fetch(`${supabaseUrl}/rest/v1/user_roles?role=eq.admin&select=user_id`, {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });
    if (!rolesRes.ok) return [];
    const roles = await rolesRes.json();
    if (!roles || roles.length === 0) return [];

    const adminUserIds: string[] = roles.map((r: { user_id: string }) => r.user_id);

    // Step 2: Batch-fetch all admin profiles in ONE query (fixes N+1)
    const idsFilter = adminUserIds.map((id) => `"${id}"`).join(",");
    const profilesRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=in.(${idsFilter})&select=email`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );
    if (!profilesRes.ok) return [];
    const profiles = await profilesRes.json();
    return (profiles || [])
      .map((p: { email: string | null }) => p.email)
      .filter((e: string | null): e is string => !!e);
  } catch (err) {
    console.error("getAdminEmails failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Escape HTML to prevent injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SF Services <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
    }
  } catch (err) {
    console.error("sendEmail failed:", err instanceof Error ? err.message : err);
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
  const safeTitle = escapeHtml(ticketTitle);
  const safeName = escapeHtml(recipientName);
  const statusFormatted = escapeHtml(formatStatus(status));
  const heading = isNew ? "New Ticket Submitted" : "Ticket Status Updated";
  const message = isNew
    ? `Your ticket "<strong>${safeTitle}</strong>" has been submitted successfully. Our team will review it shortly.`
    : `The status of your ticket "<strong>${safeTitle}</strong>" has been updated to <strong>${statusFormatted}</strong>.`;

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
        ${priority ? `<tr>
          <td style="padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;">PRIORITY</td>
          <td style="padding:10px 14px;font-size:13px;color:#1a1a2e;text-transform:capitalize;">${escapeHtml(priority)}</td>
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
    // This function is called by a database trigger via pg_net.
    // We verify the request contains a valid Authorization header with the anon or service key.
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Allow anon key, service key, or skip auth if called internally (no auth header but valid payload)
    const isAuthorized = !authHeader || token === anonKey || token === serviceKey;
    if (authHeader && !isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const { type, table, record } = payload;

    // Validate payload structure
    if (!type || !table) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (table !== "tickets" || !record) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    const ticket = record as TicketRecord;
    if (!ticket.user_id || !ticket.title || !ticket.id) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user_id is a UUID to prevent injection in REST query
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ticket.user_id)) {
      return new Response(JSON.stringify({ error: "Invalid user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isNew = type === "INSERT";

    // Fetch user and admin emails concurrently (performance)
    const [user, adminEmails] = await Promise.all([
      getUserEmail(ticket.user_id),
      getAdminEmails(),
    ]);

    const safeTitle = ticket.title.slice(0, 200);
    const subject = isNew
      ? `New Ticket: ${safeTitle}`
      : `Ticket Updated: ${safeTitle} → ${formatStatus(ticket.status)}`;

    // Send emails concurrently (performance)
    const emailPromises: Promise<void>[] = [];

    if (user?.email) {
      emailPromises.push(
        sendEmail(
          [user.email],
          subject,
          ticketEmailTemplate(user.name, safeTitle, ticket.id, ticket.status, isNew, ticket.priority),
        )
      );
    }

    const adminRecipients = adminEmails.filter((e) => e !== user?.email);
    if (adminRecipients.length > 0) {
      emailPromises.push(
        sendEmail(
          adminRecipients,
          subject,
          ticketEmailTemplate("Admin", safeTitle, ticket.id, ticket.status, isNew, ticket.priority),
        )
      );
    }

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
