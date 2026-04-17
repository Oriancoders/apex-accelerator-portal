import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, History, Power, Link as LinkIcon, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buildOAuthURL } from "@/lib/salesforce-oauth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SandboxConnectProps = {
  ticket: any;
  onConnected: (connection?: any) => void;
};

type ConnectState = "idle" | "connecting" | "connected" | "revoked";

export default function SandboxConnect({ ticket, onConnected }: SandboxConnectProps) {
  const { user } = useAuth();
  const db = supabase as any;
  const [state, setState] = useState<ConnectState>("idle");
  const [connection, setConnection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ticketId = ticket?.id;

  useEffect(() => {
    let active = true;

    const loadConnection = async () => {
      if (!ticketId) {
        setLoading(false);
        return;
      }

      const { data, error } = await db
        .from("sandbox_connections")
        .select("*")
        .eq("ticket_id", ticketId)
        .eq("is_active", true)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (error) {
        console.error("Failed to fetch sandbox connection", error);
        setErrorMessage("Unable to check current sandbox connection.");
      }

      if (data) {
        setConnection(data);
        setState("connected");
        onConnected(data);
      }

      setLoading(false);
    };

    loadConnection();

    return () => {
      active = false;
    };
  }, [ticketId, onConnected]);

  const indicators = useMemo(
    () => [
      { label: "Sandbox only", icon: ShieldCheck },
      { label: "Full audit log", icon: History },
      { label: "One-click revoke", icon: Power },
    ],
    []
  );

  const handleConnect = () => {
    try {
      setState("connecting");
      setErrorMessage(null);
      const oauthUrl = buildOAuthURL(ticketId);
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("Failed to initiate OAuth", error);
      setState("idle");
      setErrorMessage("Unable to start Salesforce OAuth flow.");
    }
  };

  const handleRevoke = async () => {
    if (!connection || !user) {
      return;
    }

    setErrorMessage(null);

    const { error: revokeError } = await db
      .from("sandbox_connections")
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq("id", connection.id);

    if (revokeError) {
      console.error("Failed to revoke connection", revokeError);
      setErrorMessage("Could not revoke sandbox access right now.");
      return;
    }

    await db.from("sandbox_audit_log").insert({
      connection_id: connection.id,
      ticket_id: connection.ticket_id,
      action_type: "oauth_revoked",
      action_detail: { reason: "client_manual_revoke" },
      performed_by: user.id,
      sf_api_endpoint: "local/revoke",
    });

    setState("revoked");
    setConnection(null);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-border/80">
        <CardContent className="p-5 text-sm text-muted-foreground">Checking sandbox connection...</CardContent>
      </Card>
    );
  }

  if (state === "connecting") {
    return (
      <Card className="rounded-2xl border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-sm font-medium text-primary">Redirecting to Salesforce sandbox...</CardContent>
      </Card>
    );
  }

  if (state === "connected" && connection) {
    return (
      <Card className="rounded-2xl border-success/30 bg-success/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-success" /> Sandbox Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm">
            <p><span className="text-muted-foreground">Org ID:</span> {connection.sf_org_id || "Unknown"}</p>
            <p><span className="text-muted-foreground">Instance:</span> {connection.sf_instance_url}</p>
            <p><span className="text-muted-foreground">User:</span> {connection.sf_user_email || "Unknown"}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleRevoke}>Revoke Access</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-primary/25 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" /> Connect Salesforce Sandbox
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {indicators.map((item) => {
            const Icon = item.icon;
            return (
              <Badge key={item.label} variant="secondary" className="gap-1.5 bg-background/80">
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Badge>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          Connect your sandbox to let our team inspect metadata, prepare fixes, and track every action in your audit trail.
        </p>

        {state === "revoked" && (
          <p className="text-sm text-warning">Sandbox access was revoked. You can reconnect any time.</p>
        )}

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        <Button className="w-full" onClick={handleConnect}>Connect Sandbox via OAuth</Button>
      </CardContent>
    </Card>
  );
}
