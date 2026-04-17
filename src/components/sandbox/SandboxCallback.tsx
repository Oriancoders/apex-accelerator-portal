import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { exchangeCodeForTokens, isProductionOrg, verifyState } from "@/lib/salesforce-oauth";

type StepState = {
  index: number;
  label: string;
};

const TOTAL_STEPS = 8;

// ✅ Fetch identity through your Edge Function — avoids CORS block
async function fetchIdentityViaEdge(identityUrl: string, accessToken: string): Promise<any> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session.");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sf-api/identity`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ identity_url: identityUrl, access_token: accessToken }),
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Unable to fetch Salesforce identity.");
  }

  return payload;
}

export default function SandboxCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const db = supabase as any;

  const [step, setStep] = useState<StepState>({ index: 1, label: "Extracting callback params" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        // ── Step 1 ──────────────────────────────────────────────
        setStep({ index: 1, label: "Extracting callback params" });

        if (!user) {
          throw new Error("You must be signed in to connect a sandbox.");
        }

        const code = searchParams.get("code") || "";
        const returnedState = searchParams.get("state") || "";
        const sfError = searchParams.get("error");

        // If Salesforce itself returned an error, surface it clearly
        if (sfError) {
          const desc = searchParams.get("error_description") || sfError;
          throw new Error(`Salesforce error: ${desc.replace(/\+/g, " ")}`);
        }

        if (!code || !returnedState) {
          throw new Error("Missing OAuth callback parameters.");
        }

        // ── Step 2 ──────────────────────────────────────────────
        setStep({ index: 2, label: "Verifying security state" });
        const { ticketId } = verifyState(returnedState);

        // ── Step 3 ──────────────────────────────────────────────
        setStep({ index: 3, label: "Exchanging code for sandbox tokens" });
        const tokenPayload = await exchangeCodeForTokens(code);

        // ── Step 4 ──────────────────────────────────────────────
        setStep({ index: 4, label: "Validating org environment" });

        if (isProductionOrg(tokenPayload.instance_url)) {
          throw new Error(
            "Production Salesforce orgs are not allowed. Please connect a sandbox org."
          );
        }

        // ── Step 5 ──────────────────────────────────────────────
        // ✅ Route through Edge Function to avoid browser CORS block
        setStep({ index: 5, label: "Loading Salesforce identity" });
        const identity = await fetchIdentityViaEdge(tokenPayload.id, tokenPayload.access_token);

        // ── Step 6 ──────────────────────────────────────────────
        setStep({ index: 6, label: "Saving secure connection" });

        const expiresAt = tokenPayload.expires_in
          ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString()
          : new Date(Date.now() + 1000 * 60 * 30).toISOString();

        const { data: connection, error: upsertError } = await db
          .from("sandbox_connections")
          .upsert(
            {
              ticket_id: ticketId,
              user_id: user.id,
              sf_org_id: identity.organization_id,
              sf_instance_url: tokenPayload.instance_url,
              sf_org_type: "sandbox",
              access_token: tokenPayload.access_token,
              refresh_token: tokenPayload.refresh_token ?? null,
              token_expires_at: expiresAt,
              sf_user_id: identity.user_id,
              sf_user_email: identity.email,
              sf_display_name: identity.display_name ?? identity.name ?? null,
              is_active: true,
              revoked_at: null,
              revoked_by: null,
            },
            { onConflict: "ticket_id" }
          )
          .select("id")
          .single();

        if (upsertError || !connection) {
          console.error("Supabase upsert error:", upsertError);
          throw new Error("Failed to save sandbox connection.");
        }

        // ── Step 7 ──────────────────────────────────────────────
        setStep({ index: 7, label: "Writing audit record" });

        const { error: auditError } = await db.from("sandbox_audit_log").insert({
          connection_id: connection.id,
          ticket_id: ticketId,
          action_type: "oauth_connected",
          action_detail: {
            organization_id: identity.organization_id,
            user_email: identity.email,
            instance_url: tokenPayload.instance_url,
          },
          performed_by: user.id,
          sf_api_endpoint: "oauth/connect",
        });

        if (auditError) {
          // Non-fatal — log but don't block the user
          console.error("Audit log insert failed:", auditError);
        }

        // ── Step 8 ──────────────────────────────────────────────
        setStep({ index: 8, label: "Redirecting to your ticket" });

        if (active) {
          navigate(`/tickets/${ticketId}?sandbox=connected`, { replace: true });
        }
      } catch (err) {
        console.error("Sandbox OAuth callback failed:", err);
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Sandbox connection failed. Please retry from your ticket page."
          );
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [navigate, searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-xl rounded-2xl">
        <CardHeader>
          <CardTitle>Connecting Salesforce Sandbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Step {step.index} of {TOTAL_STEPS}: {step.label}
          </p>
          <Progress value={(step.index / TOTAL_STEPS) * 100} />
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive font-medium">Connection failed</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-3 text-sm underline text-destructive/70 hover:text-destructive"
              >
                Go back and try again
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}