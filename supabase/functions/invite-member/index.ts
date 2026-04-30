import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type InviteRequest = {
  companyId: string;
  fullName: string;
  email: string;
  membershipRole: "admin" | "member" | "owner" | "billing";
};

type JsonRecord = Record<string, unknown>;
type RequesterKind = "platform_admin" | "company_manager" | "assigned_agent";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripControlChars(value: string) {
  return [...value].filter((char) => {
    const code = char.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join("");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return stripControlChars(name).trim().replace(/\s+/g, " ");
}

function isValidEmail(email: string) {
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}

function jsonResponse(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeAppUrl(appUrl: string) {
  return appUrl.replace(/\/+$/, "");
}

function getAllowedRedirectOrigins() {
  const appUrl = Deno.env.get("APP_URL") ?? "";
  const extraOrigins = (Deno.env.get("ALLOWED_REDIRECT_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [appUrl, ...extraOrigins]
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

function resolveAppUrlForRequest(req: Request) {
  const fallback = normalizeAppUrl(Deno.env.get("APP_URL") ?? "http://localhost:8080");
  const allowedOrigins = getAllowedRedirectOrigins();
  const originHeaders = [
    req.headers.get("origin"),
    req.headers.get("referer"),
  ].filter(Boolean) as string[];

  for (const candidate of originHeaders) {
    try {
      const origin = new URL(candidate).origin;
      if (allowedOrigins.includes(origin)) return origin;
    } catch {
      // Ignore malformed origin headers.
    }
  }

  return fallback;
}

function isRoleAllowedForRequester(kind: RequesterKind, membershipRole: InviteRequest["membershipRole"]) {
  if (kind === "platform_admin") return ["owner", "admin", "member", "billing"].includes(membershipRole);
  if (kind === "company_manager") return ["admin", "member"].includes(membershipRole);
  return membershipRole === "member";
}

function toPublicResetError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (message.toLowerCase().includes("rate")) {
    return "Password reset email is rate limited. Please try again later.";
  }
  return "Password reset email could not be sent.";
}

async function sendResetPasswordEmail(supabaseUrl: string, anonKey: string, email: string, appUrl: string) {
  const supabasePublic = createClient(supabaseUrl, anonKey);
  const redirectTo = `${normalizeAppUrl(appUrl)}/reset-password`;
  console.log("invite-member: reset redirect target:", redirectTo);
  const { error } = await supabasePublic.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.error("invite-member: reset password email error:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !serviceRole || !anonKey) {
    console.error("invite-member: Missing Supabase environment configuration");
    return jsonResponse({ error: "Supabase function environment is not configured." }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRole);

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });

  try {
    const body = (await req.json()) as Partial<InviteRequest>;
    const companyId = typeof body.companyId === "string" ? body.companyId : "";
    const fullName = normalizeName(typeof body.fullName === "string" ? body.fullName : "");
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const membershipRole = body.membershipRole as InviteRequest["membershipRole"] | undefined;

    if (!UUID_RE.test(companyId)) {
      return jsonResponse({ error: "companyId is required" }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: "Valid email is required" }, 400);
    }

    if (!fullName || fullName.length > 120) {
      return jsonResponse({ error: "Name is required and must be 120 characters or less" }, 400);
    }

    if (!membershipRole || !["admin", "member", "owner", "billing"].includes(membershipRole)) {
      return jsonResponse({ error: "Invalid membershipRole" }, 400);
    }

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authData?.user?.id) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const requesterId = authData.user.id;

    const [{ data: roleRow, error: roleError }, { data: companyRow, error: companyError }] = await Promise.all([
      supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", requesterId)
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("companies")
        .select("id,name")
        .eq("id", companyId)
        .maybeSingle(),
    ]);

    if (roleError) throw roleError;
    if (companyError) throw companyError;
    if (!companyRow) {
      return jsonResponse({ error: "Company not found" }, 404);
    }

    const requesterRole = (roleRow as any)?.role as string | undefined;

    let requesterKind: RequesterKind | null = null;
    if (requesterRole === "admin") requesterKind = "platform_admin";

    if (!requesterKind && requesterRole === "company_admin") {
      const { data: m, error: mErr } = await supabaseAdmin
        .from("company_memberships")
        .select("role")
        .eq("company_id", companyId)
        .eq("user_id", requesterId)
        .maybeSingle();
      if (mErr) throw mErr;
      if (m && ((m as any).role === "owner" || (m as any).role === "admin")) requesterKind = "company_manager";
    }

    if (!requesterKind && requesterRole === "agent") {
      const { data: agentRow, error: agentErr } = await supabaseAdmin
        .from("agents")
        .select("id,is_active")
        .eq("user_id", requesterId)
        .maybeSingle();
      if (agentErr) throw agentErr;

      const agentId = (agentRow as any)?.id as string | undefined;
      const isActive = Boolean((agentRow as any)?.is_active);
      if (agentId && isActive) {
        const { data: assignRow, error: assignErr } = await supabaseAdmin
          .from("agent_company_assignments")
          .select("id")
          .eq("company_id", companyId)
          .eq("agent_id", agentId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (assignErr) throw assignErr;
        if (assignRow) requesterKind = "assigned_agent";
      }
    }

    if (!requesterKind) {
      return jsonResponse({ error: "Not allowed" }, 403);
    }

    if (!isRoleAllowedForRequester(requesterKind, membershipRole)) {
      return jsonResponse({ error: "Not allowed to grant that membership role" }, 403);
    }

    // 1) Check if user exists in profiles
    const { data: profileRow, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, email")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (profileErr) throw profileErr;

    let userId = (profileRow as any)?.user_id as string | undefined;
    let created = false;

    // 2) If not in profiles, check if exists in auth.users
    if (!userId) {
      console.log(`invite-member: User not in profiles, checking auth.users for email: ${email}`);
      const perPage = 1000;
      for (let page = 1; page <= 10 && !userId; page++) {
        const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });
        if (authErr) {
          console.error("invite-member: Error listing users:", authErr);
          throw authErr;
        }

        const users = authUsers?.users || [];
        const existingAuthUser = users.find((u) => u.email?.toLowerCase() === email);

        if (existingAuthUser) {
          console.log(`invite-member: User found in auth.users with ID: ${existingAuthUser.id}`);
          userId = existingAuthUser.id;
          break;
        }

        if (users.length < perPage) break;
      }
    }

    // 3) Create user if missing
    if (!userId) {
      console.log(`invite-member: Creating new user for email: ${email}`);
      const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createErr) {
        console.error("invite-member: createUser error - code:", (createErr as any)?.code, "message:", (createErr as any)?.message);
        return jsonResponse({
          error: `User creation failed: ${(createErr as any)?.message || JSON.stringify(createErr)}`
        }, 400);
      }

      userId = createdUser.user?.id;
      if (!userId) {
        console.error("invite-member: Created user but no ID returned");
        return jsonResponse({ error: "User created but no ID returned" }, 500);
      }
      console.log(`invite-member: User created successfully: ${userId}`);
      created = true;
    }

    if (!userId) {
      return jsonResponse({ error: "Unable to resolve user" }, 500);
    }

    const appUrl = resolveAppUrlForRequest(req);

    try {
      console.log(`invite-member: Sending reset password email to ${email}`);
      await sendResetPasswordEmail(supabaseUrl, anonKey, email, appUrl);
      console.log(`invite-member: Reset password email sent to ${email}`);
    } catch (resetErr) {
      const resetError = toPublicResetError(resetErr);
      console.error("invite-member: Reset password email failed:", resetErr);

      if (created) {
        console.warn(`invite-member: Rolling back newly created user ${userId} because reset email failed`);
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteErr) {
          console.error("invite-member: Failed to rollback created user after reset email failure:", deleteErr);
          return jsonResponse({
            error: resetError,
            resetEmailSent: false,
            rollbackFailed: true,
          }, 502);
        }
      }

      return jsonResponse({
        error: resetError,
        resetEmailSent: false,
      }, 502);
    }

    // 4) Ensure profile exists. Some older auth users may not have a profile row.
    const { data: userProfile, error: userProfileErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id,email,full_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (userProfileErr) throw userProfileErr;

    if (!userProfile) {
      console.log(`invite-member: Creating missing profile for user ${userId}`);
      const { error: profileInsertErr } = await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        email,
        full_name: fullName,
      });
      if (profileInsertErr) {
        console.error("invite-member: Profile insert error:", profileInsertErr);
        throw profileInsertErr;
      }
    } else {
      const { error: profileUpdateErr } = await supabaseAdmin
        .from("profiles")
        .update({ email, full_name: fullName, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (profileUpdateErr) {
        console.error("invite-member: Profile update error:", profileUpdateErr);
        throw profileUpdateErr;
      }
    }

    // 5) Ensure membership exists
    console.log(`invite-member: Checking membership for user ${userId} in company ${companyId}`);
    const { data: existingMembership, error: memErr } = await supabaseAdmin
      .from("company_memberships")
      .select("id, role")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .maybeSingle();
    if (memErr) {
      console.error("invite-member: Membership check error:", memErr);
      throw memErr;
    }

    let membershipCreated = false;
    let membershipRoleUpdated = false;
    if (!existingMembership) {
      const { count: existingMembershipCount, error: countErr } = await supabaseAdmin
        .from("company_memberships")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (countErr) throw countErr;

      console.log(`invite-member: Creating membership for user ${userId} with role ${membershipRole}`);
      const { error: insertErr } = await supabaseAdmin.from("company_memberships").insert({
        company_id: companyId,
        user_id: userId,
        role: membershipRole,
        invited_by: requesterId,
        is_primary: (existingMembershipCount ?? 0) === 0,
      });
      if (insertErr) {
        console.error("invite-member: Membership insert error:", insertErr);
        throw insertErr;
      }
      console.log(`invite-member: Membership created successfully`);
      membershipCreated = true;
    } else if ((existingMembership as any).role !== membershipRole) {
      console.log(`invite-member: Updating existing membership role to ${membershipRole}`);
      const { error: updateRoleErr } = await supabaseAdmin
        .from("company_memberships")
        .update({ role: membershipRole, updated_at: new Date().toISOString() })
        .eq("id", (existingMembership as any).id);
      if (updateRoleErr) {
        console.error("invite-member: Membership role update error:", updateRoleErr);
        throw updateRoleErr;
      }
      membershipRoleUpdated = true;
    } else {
      console.log(`invite-member: Membership already exists`);
    }

    return jsonResponse({
      ok: true,
      created,
      membershipCreated,
      membershipRoleUpdated,
      membershipRole,
      resetEmailSent: true,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("invite-member error:", errMsg);
    return jsonResponse({ error: errMsg }, 500);
  }
});
