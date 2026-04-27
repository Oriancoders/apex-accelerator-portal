import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const noStoreJsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
};

type AuthAction = "signin" | "reset";

type AuthRequest = {
  action: AuthAction;
  email: string;
  password?: string;
  redirectTo?: string;
  captchaToken?: string;
};

const ACTION_LIMITS: Record<AuthAction, { windowSeconds: number; maxRequests: number }> = {
  signin: { windowSeconds: 60, maxRequests: 10 },
  reset: { windowSeconds: 300, maxRequests: 4 },
};

const SIGNIN_FAILED_ATTEMPT_LIMIT = {
  windowSeconds: 300,
  maxRequests: 5,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const firstForwarded = xff.split(",")[0]?.trim();
  return (
    firstForwarded ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}

async function verifyCaptcha(token: string | undefined, ip: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";
  if (!secret) return { ok: true };
  if (!token || token.length > 2048) {
    return { ok: false, codes: ["missing-input-response"] };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip !== "unknown") formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return { ok: false, codes: [`siteverify-http-${response.status}`] };
  }
  const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
  return { ok: Boolean(result.success), codes: result["error-codes"] ?? [] };
}

function getAllowedRedirectOrigins() {
  const appUrl = Deno.env.get("APP_URL") ?? "";
  const extraOrigins = (Deno.env.get("ALLOWED_REDIRECT_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    appUrl,
    "http://localhost:8080",
    "http://localhost:5173",
    ...extraOrigins,
  ]
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

function safeRedirectTo(candidate?: string) {
  const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8080";
  const fallback = `${appUrl.replace(/\/+$/, "")}/reset-password`;
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate);
    if (getAllowedRedirectOrigins().includes(url.origin)) {
      return url.toString();
    }
  } catch {
    // Ignore invalid URLs and use fallback.
  }

  return fallback;
}

async function checkLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  key: string,
  windowSeconds: number,
  maxRequests: number
) {
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (error) {
    console.error("auth-guard rate-limit error:", error);
    return { serviceError: true, allowed: false };
  }

  return {
    serviceError: false,
    allowed: Boolean((data as any)?.allowed),
    resetAt: (data as any)?.reset_at,
  };
}

async function getLimitStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  key: string,
  windowSeconds: number,
  maxRequests: number
) {
  const { data, error } = await supabaseAdmin.rpc("get_rate_limit_status", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (error) {
    console.error("auth-guard rate-limit status error:", error);
    return { serviceError: true, allowed: false, resetAt: null as string | null };
  }

  return {
    serviceError: false,
    allowed: Boolean((data as any)?.allowed),
    resetAt: ((data as any)?.reset_at as string | null) ?? null,
  };
}

async function clearLimitKey(supabaseAdmin: ReturnType<typeof createClient>, key: string) {
  const { error } = await supabaseAdmin.rpc("clear_rate_limit_key", { p_key: key });
  if (error) {
    console.error("auth-guard clear rate-limit key error:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const body = (await req.json()) as AuthRequest;
    const action = body?.action;

    if (!action || !["signin", "reset"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid auth action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp = getClientIp(req);
    const captchaResult = await verifyCaptcha(
      typeof body.captchaToken === "string" ? body.captchaToken : undefined,
      clientIp
    );
    if (!captchaResult.ok) {
      console.warn("Turnstile verification failed", {
        action,
        codes: captchaResult.codes,
        hasToken: typeof body.captchaToken === "string" && body.captchaToken.length > 0,
      });
      return new Response(JSON.stringify({ error: "Security challenge failed. Please try again." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limits = ACTION_LIMITS[action];

    const ipLimit = await checkLimit(
      supabaseAdmin,
      `auth:${action}:ip:${clientIp}`,
      limits.windowSeconds,
      limits.maxRequests
    );
    if (ipLimit.serviceError) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ipLimit.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailLimit = await checkLimit(
      supabaseAdmin,
      `auth:${action}:email:${email}`,
      limits.windowSeconds,
      limits.maxRequests
    );
    if (emailLimit.serviceError) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!emailLimit.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "signin") {
      const password = typeof body.password === "string" ? body.password : "";
      if (!password || password.length > 1024) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const failKey = `auth:signin:fail:${email}`;
      const failStatus = await getLimitStatus(
        supabaseAdmin,
        failKey,
        SIGNIN_FAILED_ATTEMPT_LIMIT.windowSeconds,
        SIGNIN_FAILED_ATTEMPT_LIMIT.maxRequests
      );
      if (failStatus.serviceError) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!failStatus.allowed) {
        const retryHeaders = failStatus.resetAt
          ? {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": `${Math.max(1, Math.ceil((new Date(failStatus.resetAt).getTime() - Date.now()) / 1000))}`,
            }
          : { ...corsHeaders, "Content-Type": "application/json" };

        return new Response(JSON.stringify({ error: "Too many failed attempts. Please try again later." }), {
          status: 429,
          headers: retryHeaders,
        });
      }

      const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

      if (error || !data.session || !data.user) {
        const failedAttemptLimit = await checkLimit(
          supabaseAdmin,
          failKey,
          SIGNIN_FAILED_ATTEMPT_LIMIT.windowSeconds,
          SIGNIN_FAILED_ATTEMPT_LIMIT.maxRequests
        );

        if (failedAttemptLimit.serviceError) {
          return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!failedAttemptLimit.allowed) {
          const retryHeaders = failedAttemptLimit.resetAt
            ? {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Retry-After": `${Math.max(1, Math.ceil((new Date(failedAttemptLimit.resetAt).getTime() - Date.now()) / 1000))}`,
              }
            : { ...corsHeaders, "Content-Type": "application/json" };

          return new Response(JSON.stringify({ error: "Too many failed attempts. Please try again later." }), {
            status: 429,
            headers: retryHeaders,
          });
        }

        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await clearLimitKey(supabaseAdmin, failKey);

      return new Response(
        JSON.stringify({
          success: true,
          user: { id: data.user.id, email: data.user.email ?? email },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
        }),
        {
          status: 200,
          headers: noStoreJsonHeaders,
        }
      );
    }

    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: safeRedirectTo(body.redirectTo),
    });

    if (error) {
      // Keep response generic to avoid account enumeration.
      console.error("reset password error:", error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: noStoreJsonHeaders,
    });
  } catch (error) {
    console.error("auth-guard error:", error);
    return new Response(JSON.stringify({ error: "Authentication service error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
