import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULTS = {
  dollarPerCredit: 2.5,
  packages: [
    { buy: 10, bonus: 2 },
    { buy: 25, bonus: 6 },
    { buy: 50, bonus: 15 },
    { buy: 100, bonus: 35 },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Read-only admin client for credit_settings
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { packageIndex } = await req.json();
    if (typeof packageIndex !== "number" || packageIndex < 0) {
      throw new Error("Invalid package selection");
    }

    // SERVER-SIDE: Load credit settings from database (never trust client price)
    const { data: settingsRows } = await supabaseAdmin
      .from("credit_settings")
      .select("key, value");

    let dollarPerCredit = DEFAULTS.dollarPerCredit;
    let packages = DEFAULTS.packages;

    if (settingsRows && settingsRows.length > 0) {
      const map: Record<string, any> = {};
      settingsRows.forEach((row: any) => { map[row.key] = row.value; });
      dollarPerCredit = parseFloat(map.dollar_per_credit) || DEFAULTS.dollarPerCredit;
      packages = map.credit_packages || DEFAULTS.packages;
    }

    if (packageIndex >= packages.length) {
      throw new Error("Invalid package index");
    }

    const pkg = packages[packageIndex];
    const buyCredits = pkg.buy;
    const bonusCredits = pkg.bonus || 0;
    const totalCredits = buyCredits + bonusCredits;

    // Server-computed price — client cannot manipulate this
    const priceInCents = Math.round(buyCredits * dollarPerCredit * 100);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Use SITE_URL from env (your custom domain), fallback to request origin
    const siteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://apex-accelerator-portal.lovable.app";
    const safeOrigin = siteUrl.replace(/\/+$/, "");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${buyCredits} Credits` + (bonusCredits > 0 ? ` (+${bonusCredits} Free)` : ""),
              description: `Total: ${totalCredits} credits for your account`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        user_id: user.id,
        total_credits: String(totalCredits),
        buy_credits: String(buyCredits),
        bonus_credits: String(bonusCredits),
      },
      success_url: `${safeOrigin}/credits?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${safeOrigin}/credits`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Don't leak internal error details
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
