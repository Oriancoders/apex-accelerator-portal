// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SFTokenResponse = {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at?: string;
  signature?: string;
  expires_in?: string | number;
};

function isProductionOrg(instanceUrl: string): boolean {
  try {
    const host = new URL(instanceUrl).hostname.toLowerCase();

    if (host === "login.salesforce.com") {
      return true;
    }

    if (!host.includes("salesforce.com")) {
      return true;
    }

    const looksSandbox = host.includes("sandbox") || host.startsWith("cs") || host.includes("test.salesforce.com");
    return !looksSandbox;
  } catch {
    return true;
  }
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getServiceRoleKey(): string {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY") || "";
}

async function verifyUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: json(401, { error: "Unauthorized" }) };
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user) {
    return { error: json(401, { error: "Invalid or expired session" }) };
  }

  return { user: data.user };
}

async function requestTokenExchange(params: URLSearchParams) {
  const response = await fetch("https://test.salesforce.com/services/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const payload = await response.json();
  if (!response.ok || payload?.error) {
    return { error: payload };
  }

  return { data: payload as SFTokenResponse };
}

async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: Deno.env.get("SF_CLIENT_ID") ?? "",
    client_secret: Deno.env.get("SF_CLIENT_SECRET") ?? "",
    refresh_token: refreshToken,
  });

  const response = await requestTokenExchange(params);
  if (response.error) {
    return { error: response.error };
  }

  return { data: response.data };
}

async function userCanAccessTicket(supabaseAdmin: ReturnType<typeof createClient>, ticketId: string, userId: string) {
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from("tickets")
    .select("id,user_id,company_id")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    return { error: "Ticket not found", status: 404 };
  }

  if (ticket.user_id === userId) {
    return { ok: true };
  }

  const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (!adminError && isAdmin) {
    return { ok: true };
  }

  const { data: isAssignedAgent, error: agentError } = await supabaseAdmin.rpc("is_company_assigned_agent", {
    _user_id: userId,
    _company_id: ticket.company_id,
  });

  if (!agentError && isAssignedAgent) {
    return { ok: true };
  }

  return { error: "Forbidden", status: 403 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let pathname = url.pathname;
  pathname = pathname.replace(/^\/functions\/v1\/sf-api/, "");
  pathname = pathname.replace(/^\/sf-api/, "");
  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  const auth = await verifyUser(req);
  if (auth.error) {
    return auth.error;
  }

  const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", getServiceRoleKey());

  try {
    if (req.method === "POST" && pathname === "/exchange-token") {
      const body = await req.json().catch(() => ({}));
      const code = typeof body.code === "string" ? body.code.trim() : "";

      if (!code) {
        return json(400, { error: "code is required" });
      }

      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: Deno.env.get("SF_CLIENT_ID") ?? "",
        client_secret: Deno.env.get("SF_CLIENT_SECRET") ?? "",
        redirect_uri: Deno.env.get("SF_REDIRECT_URI") ?? "",
      });

      const exchanged = await requestTokenExchange(params);
      if (exchanged.error) {
        console.error("Salesforce token exchange rejected:", exchanged.error);
        return json(400, { error: exchanged.error?.error_description || exchanged.error?.error || "Salesforce rejected code" });
      }

      const tokenData = exchanged.data;
      if (isProductionOrg(tokenData.instance_url)) {
        console.error("Blocked production org in token exchange", { instance_url: tokenData.instance_url });
        return json(400, { error: "Production Salesforce orgs are not allowed" });
      }

      return json(200, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        instance_url: tokenData.instance_url,
        id: tokenData.id,
        token_type: tokenData.token_type,
        issued_at: tokenData.issued_at,
        expires_in: tokenData.expires_in,
      });
    }

    if (req.method === "POST" && pathname === "/identity") {
      const body = await req.json().catch(() => ({}));
      const identityUrl = typeof body.identity_url === "string" ? body.identity_url.trim() : "";
      const accessToken = typeof body.access_token === "string" ? body.access_token.trim() : "";

      if (!identityUrl || !accessToken) {
        return json(400, { error: "identity_url and access_token are required" });
      }

      let parsedIdentityUrl: URL;
      try {
        parsedIdentityUrl = new URL(identityUrl);
      } catch {
        return json(400, { error: "identity_url is invalid" });
      }

      const identityOrigin = `${parsedIdentityUrl.protocol}//${parsedIdentityUrl.host}`;
      if (isProductionOrg(identityOrigin)) {
        return json(400, { error: "Production Salesforce orgs are not allowed" });
      }

      const identityResponse = await fetch(identityUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const identityPayload = await identityResponse.json().catch(() => null);
      if (!identityResponse.ok || !identityPayload) {
        console.error("Salesforce identity fetch failed:", identityPayload);
        return json(400, { error: "Unable to fetch Salesforce identity" });
      }

      return json(200, identityPayload);
    }

    if (req.method === "GET" && pathname === "/objects") {
      const ticketId = url.searchParams.get("ticketId") || "";
      if (!ticketId) {
        return json(400, { error: "ticketId is required" });
      }

      const accessCheck = await userCanAccessTicket(supabaseAdmin, ticketId, auth.user!.id);
      if ("error" in accessCheck) {
        return json(accessCheck.status || 403, { error: accessCheck.error });
      }

      const { data: connection, error: connError } = await supabaseAdmin
        .from("sandbox_connections")
        .select("id, access_token, refresh_token, token_expires_at, sf_instance_url, is_active")
        .eq("ticket_id", ticketId)
        .eq("is_active", true)
        .single();

      if (connError || !connection) {
        return json(404, { error: "No active sandbox connection found" });
      }

      let accessToken = connection.access_token;
      const now = Date.now();
      const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : null;

      if (expiresAt && expiresAt - now < 60_000) {
        const refreshed = await refreshAccessToken(connection.refresh_token);
        if (refreshed.error) {
          console.error("Salesforce refresh failed:", refreshed.error);
          return json(401, { error: "Salesforce token expired and refresh failed" });
        }

        accessToken = refreshed.data.access_token;

        const nextExpires = new Date(Date.now() + 1000 * 60 * 30).toISOString();
        await supabaseAdmin
          .from("sandbox_connections")
          .update({
            access_token: refreshed.data.access_token,
            refresh_token: refreshed.data.refresh_token || connection.refresh_token,
            sf_instance_url: refreshed.data.instance_url || connection.sf_instance_url,
            token_expires_at: nextExpires,
          })
          .eq("id", connection.id);
      }

      const objectsResponse = await fetch(`${connection.sf_instance_url}/services/data/v59.0/sobjects/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (objectsResponse.status === 401) {
        const refreshed = await refreshAccessToken(connection.refresh_token);
        if (refreshed.error) {
          console.error("Salesforce refresh after 401 failed:", refreshed.error);
          return json(401, { error: "Salesforce session expired. Please reconnect sandbox." });
        }

        accessToken = refreshed.data.access_token;

        await supabaseAdmin
          .from("sandbox_connections")
          .update({
            access_token: refreshed.data.access_token,
            refresh_token: refreshed.data.refresh_token || connection.refresh_token,
            sf_instance_url: refreshed.data.instance_url || connection.sf_instance_url,
            token_expires_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
          })
          .eq("id", connection.id);

        const retryResponse = await fetch(`${connection.sf_instance_url}/services/data/v59.0/sobjects/`, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const retryPayload = await retryResponse.json();
        if (!retryResponse.ok) {
          console.error("Salesforce objects fetch failed after refresh:", retryPayload);
          return json(401, { error: "Unable to fetch Salesforce objects. Please reconnect sandbox." });
        }

        return json(200, { sobjects: retryPayload.sobjects || [] });
      }

      const payload = await objectsResponse.json();
      if (!objectsResponse.ok) {
        console.error("Salesforce objects fetch failed:", payload);
        return json(400, { error: "Unable to fetch Salesforce objects" });
      }

      return json(200, { sobjects: payload.sobjects || [] });
    }

    return json(404, { error: "Not found" });
  } catch (error) {
    console.error("sf-api unexpected error:", error);
    return json(500, { error: "Unexpected server error" });
  }
});
