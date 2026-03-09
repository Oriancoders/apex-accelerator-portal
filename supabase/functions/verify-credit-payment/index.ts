import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user
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
    if (!user) throw new Error("User not authenticated");

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string") throw new Error("Missing or invalid session ID");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userId = session.metadata?.user_id;
    const totalCredits = parseInt(session.metadata?.total_credits || "0");
    const buyCredits = session.metadata?.buy_credits || "0";
    const bonusCredits = session.metadata?.bonus_credits || "0";

    if (!userId || totalCredits <= 0) throw new Error("Invalid session metadata");

    // Verify the requesting user matches the session user
    if (user.id !== userId) throw new Error("User mismatch");

    // Use atomic function to add credits (prevents race conditions)
    const { data: newCredits, error: rpcError } = await supabaseAdmin.rpc("add_purchase_credits", {
      p_user_id: userId,
      p_amount: totalCredits,
      p_description: `Purchased ${buyCredits} credits (+${bonusCredits} bonus)`,
      p_stripe_session_id: sessionId,
    });

    if (rpcError) throw rpcError;

    // Check if it was a duplicate (credits returned but no new transaction)
    const { data: txCheck } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("stripe_session_id", sessionId);

    const alreadyProcessed = txCheck && txCheck.length > 1;

    return new Response(
      JSON.stringify({
        success: true,
        credits_added: totalCredits,
        new_balance: newCredits,
        ...(alreadyProcessed ? { already_processed: true } : {}),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
