import { useEffect, useMemo, useState } from "react";
import { Database, Search, Shield, Boxes, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchObjectsForTicket } from "@/lib/salesforce-oauth";

type SandboxDashboardProps = {
  ticketId: string;
};

function formatActionName(actionType: string) {
  return actionType
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

export default function SandboxDashboard({ ticketId }: SandboxDashboardProps) {
  const db = supabase as any;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [connection, setConnection] = useState<any | null>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: connectionRow, error: connectionError } = await db
          .from("sandbox_connections")
          .select("*")
          .eq("ticket_id", ticketId)
          .eq("is_active", true)
          .single();

        if (connectionError || !connectionRow) {
          throw new Error("No active sandbox connection found.");
        }

        const [objectsPayload, auditPayload] = await Promise.all([
          fetchObjectsForTicket(ticketId),
          db
            .from("sandbox_audit_log")
            .select("*")
            .eq("ticket_id", ticketId)
            .order("created_at", { ascending: false }),
        ]);

        if (!active) {
          return;
        }

        setConnection(connectionRow);
        setObjects(objectsPayload.sobjects || []);
        setAuditLogs(auditPayload.data || []);
      } catch (err) {
        console.error("Failed to load sandbox dashboard", err);
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load sandbox dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [ticketId]);

  const filteredObjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return objects;
    }
    return objects.filter((obj) => {
      const name = (obj.name || "").toLowerCase();
      const label = (obj.label || "").toLowerCase();
      return name.includes(q) || label.includes(q);
    });
  }, [objects, searchQuery]);

  const customObjects = filteredObjects.filter((obj) => obj.custom);
  const standardObjects = filteredObjects.filter((obj) => !obj.custom);

  const stats = {
    total: objects.length,
    custom: objects.filter((obj) => obj.custom).length,
    standard: objects.filter((obj) => !obj.custom).length,
    audits: auditLogs.length,
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-border/80">
        <CardContent className="p-5 text-sm text-muted-foreground">Loading sandbox dashboard...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
        <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!connection) {
    return null;
  }

  return (
    <Card className="rounded-2xl border-success/25 bg-gradient-to-br from-success/5 via-background to-primary/5">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-success" /> Sandbox Dashboard
        </CardTitle>

        <div className="grid gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Org:</span> {connection.sf_org_id || "Unknown"}
          </p>
          <p>
            <span className="text-muted-foreground">Instance:</span>{" "}
            <a
              className="text-primary underline-offset-2 hover:underline"
              href={connection.sf_instance_url}
              target="_blank"
              rel="noreferrer"
            >
              {connection.sf_instance_url}
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">Connected User:</span> {connection.sf_user_email || "Unknown"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-success/20 text-success hover:bg-success/20">Sandbox</Badge>
          <Badge variant="secondary">Total Objects: {stats.total}</Badge>
          <Badge variant="secondary">Custom: {stats.custom}</Badge>
          <Badge variant="secondary">Standard: {stats.standard}</Badge>
          <Badge variant="secondary">Audit Events: {stats.audits}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="objects" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="objects" className="gap-1.5">
              <Boxes className="h-4 w-4" /> Objects
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <ScrollText className="h-4 w-4" /> Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="objects" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by API name or label"
                className="pl-9"
              />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-left text-sm font-medium"
              >
                Custom Objects ({customObjects.length}) {customOpen ? "-" : "+"}
              </button>

              {customOpen && (
                <div className="space-y-2">
                  {customObjects.length === 0 && (
                    <p className="text-sm text-muted-foreground">No custom objects found.</p>
                  )}
                  {customObjects.map((obj) => (
                    <div key={obj.name} className="rounded-xl border border-border bg-background p-3 text-sm">
                      <div className="font-medium">{obj.name}</div>
                      <div className="text-muted-foreground">{obj.label}</div>
                      <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                        <span>Q: {obj.queryable ? "yes" : "no"}</span>
                        <span>U: {obj.updateable ? "yes" : "no"}</span>
                        <span>C: {obj.createable ? "yes" : "no"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-border bg-background p-3">
                <p className="mb-2 text-sm font-medium">Standard Objects ({standardObjects.length})</p>
                <div className="space-y-2">
                  {standardObjects.length === 0 && (
                    <p className="text-sm text-muted-foreground">No standard objects found.</p>
                  )}
                  {standardObjects.map((obj) => (
                    <div key={obj.name} className="rounded-lg border border-border/80 p-2.5 text-sm">
                      <div className="font-medium">{obj.name}</div>
                      <div className="text-muted-foreground">{obj.label}</div>
                      <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                        <span>Q: {obj.queryable ? "yes" : "no"}</span>
                        <span>U: {obj.updateable ? "yes" : "no"}</span>
                        <span>C: {obj.createable ? "yes" : "no"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <div className="space-y-2">
              {auditLogs.length === 0 && (
                <p className="text-sm text-muted-foreground">No audit events yet.</p>
              )}
              {auditLogs.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border bg-background p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Database className="h-4 w-4 text-primary" />
                      {formatActionName(entry.action_type)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Performed by: {entry.performed_by}</p>
                  <pre className="mt-2 overflow-auto rounded-lg bg-muted p-2 text-xs">
                    {JSON.stringify(entry.action_detail || {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
