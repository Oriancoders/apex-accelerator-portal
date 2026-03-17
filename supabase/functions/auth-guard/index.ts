import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AuthAction = "signin" | "signup" | "reset";

type AuthRequest = {
  action: AuthAction;
  email: string;
  password?: string;
  fullName?: string;
  redirectTo?: string;
};

const ACTION_LIMITS: Record<AuthAction, { windowSeconds: number; maxRequests: number }> = {
  signin: { windowSeconds: 60, maxRequests: 10 },
  signup: { windowSeconds: 300, maxRequests: 5 },
  reset: { windowSeconds: 300, maxRequests: 4 },
};

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

function passwordIsStrong(password: string) {
  return (
    password.length >= 10 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
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

    if (!action || !["signin", "signup", "reset"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid auth action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = normalizeEmail(rawEmail);
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp = getClientIp(req);
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
      if (!password) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const failKey = `auth:signin:fail:${email}`;
      const failStatus = await getLimitStatus(supabaseAdmin, failKey, 900, 5);
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
          900,
          5
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "signup") {
      const password = typeof body.password === "string" ? body.password : "";
      if (!passwordIsStrong(password)) {
        return new Response(JSON.stringify({ error: "Password does not meet security requirements" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseAnon.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: (body.fullName ?? "").trim() },
          emailRedirectTo: body.redirectTo,
        },
      });

      if (error) {
        return new Response(JSON.stringify({ error: "Unable to complete sign up" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: body.redirectTo,
    });

    if (error) {
      // Keep response generic to avoid account enumeration.
      console.error("reset password error:", error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("auth-guard error:", error);
    return new Response(JSON.stringify({ error: "Authentication service error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
