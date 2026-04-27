import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type DeleteEntityType = "user" | "consultant" | "agent" | "company";

type DeleteRequest = {
  entityType?: DeleteEntityType;
  entityId?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function assertAdminOrThrow(
  supabaseUrl: string,
  anonKey: string,
  supabaseAdmin: ReturnType<typeof createClient>,
  authHeader: string,
) {
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });

  const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !authData?.user?.id) {
    throw new Error("Unauthorized");
  }

  const actorId = authData.user.id;

  const { data: adminRole, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("user_id", actorId)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (roleError) throw roleError;
  if (!adminRole) throw new Error("Forbidden");

  return actorId;
}

async function deleteAgentEntity(
  supabaseAdmin: ReturnType<typeof createClient>,
  agentId: string,
) {
  const { data: agentRow, error: agentErr } = await supabaseAdmin
    .from("agents")
    .select("id,user_id")
    .eq("id", agentId)
    .maybeSingle();

  if (agentErr) throw agentErr;
  if (!agentRow) throw new Error("Agent not found");

  const { data: assignments, error: assignmentErr } = await supabaseAdmin
    .from("agent_company_assignments")
    .select("id")
    .eq("agent_id", agentId);
  if (assignmentErr) throw assignmentErr;

  const assignmentIds = (assignments || []).map((row) => row.id).filter(Boolean);

  if (assignmentIds.length > 0) {
    const { error: deleteRulesByAssignmentErr } = await supabaseAdmin
      .from("commission_rules")
      .delete()
      .in("assignment_id", assignmentIds);
    if (deleteRulesByAssignmentErr) throw deleteRulesByAssignmentErr;
  }

  const { error: deleteRulesByAgentErr } = await supabaseAdmin
    .from("commission_rules")
    .delete()
    .eq("agent_id", agentId);
  if (deleteRulesByAgentErr) throw deleteRulesByAgentErr;

  const { error: clearCompanyAgentErr } = await supabaseAdmin
    .from("companies")
    .update({ created_via_agent_id: null })
    .eq("created_via_agent_id", agentId);
  if (clearCompanyAgentErr) throw clearCompanyAgentErr;

  const { error: deleteAssignmentsErr } = await supabaseAdmin
    .from("agent_company_assignments")
    .delete()
    .eq("agent_id", agentId);
  if (deleteAssignmentsErr) throw deleteAssignmentsErr;

  const { error: deleteAgentErr } = await supabaseAdmin
    .from("agents")
    .delete()
    .eq("id", agentId);
  if (deleteAgentErr) throw deleteAgentErr;

  return agentRow.user_id as string;
}

async function cleanupRestrictiveUserReferences(
  supabaseAdmin: ReturnType<typeof createClient>,
  targetUserId: string,
  actorId: string,
) {
  console.log(`[cleanup] Starting cleanup for user ${targetUserId}`);

  const { error: companyReassignErr } = await supabaseAdmin
    .from("companies")
    .update({ created_by: actorId })
    .eq("created_by", targetUserId);
  if (companyReassignErr) {
    console.error(`[cleanup] Company reassign failed:`, companyReassignErr);
    throw companyReassignErr;
  }

  const { error: assignmentReassignErr } = await supabaseAdmin
    .from("agent_company_assignments")
    .update({ created_by: actorId })
    .eq("created_by", targetUserId);
  if (assignmentReassignErr) {
    console.error(`[cleanup] Assignment reassign failed:`, assignmentReassignErr);
    throw assignmentReassignErr;
  }

  const { error: rulesReassignErr } = await supabaseAdmin
    .from("commission_rules")
    .update({ created_by: actorId })
    .eq("created_by", targetUserId);
  if (rulesReassignErr) {
    console.error(`[cleanup] Rules reassign failed:`, rulesReassignErr);
    throw rulesReassignErr;
  }

  const { error: ticketUpdatesUserClearErr } = await supabaseAdmin
    .from("ticket_updates")
    .update({ user_id: null })
    .eq("user_id", targetUserId);
  if (ticketUpdatesUserClearErr) {
    console.error(`[cleanup] Ticket updates clear failed:`, ticketUpdatesUserClearErr);
    throw ticketUpdatesUserClearErr;
  }

  console.log(`[cleanup] Cleanup completed successfully`);
}

async function ensureLastAdminNotDeleted(
  supabaseAdmin: ReturnType<typeof createClient>,
  targetUserId: string,
) {
  const [{ count: adminCount, error: adminCountErr }, { data: targetAdminRole, error: targetAdminErr }] =
    await Promise.all([
      supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin"),
      supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("user_id", targetUserId)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle(),
    ]);

  if (adminCountErr) throw adminCountErr;
  if (targetAdminErr) throw targetAdminErr;

  if (targetAdminRole && (adminCount ?? 0) <= 1) {
    throw new Error("Cannot delete the last admin account");
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
    console.error("admin-delete-entity: Missing Supabase environment configuration");
    return jsonResponse({ error: "Supabase function environment is not configured." }, 500);
  }

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const supabaseAdmin = createClient(supabaseUrl, serviceRole);

  try {
    const actorId = await assertAdminOrThrow(supabaseUrl, anonKey, supabaseAdmin, authHeader);

    const body = (await req.json()) as DeleteRequest;
    const entityType = body.entityType;
    const entityId = body.entityId?.trim();

    if (!entityType || !["user", "consultant", "agent", "company"].includes(entityType)) {
      return jsonResponse({ error: "Invalid entityType" }, 400);
    }

    if (!entityId || !UUID_RE.test(entityId)) {
      return jsonResponse({ error: "A valid entityId is required" }, 400);
    }

    if (entityType === "agent") {
      await deleteAgentEntity(supabaseAdmin, entityId);
      return jsonResponse({ ok: true, message: "Agent deleted" });
    }

    if (entityType === "company") {
      const { data: companyRow, error: companyFetchErr } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("id", entityId)
        .maybeSingle();
      if (companyFetchErr) throw companyFetchErr;
      if (!companyRow) return jsonResponse({ error: "Company not found" }, 404);

      const { error: deleteRulesErr } = await supabaseAdmin
        .from("commission_rules")
        .delete()
        .eq("company_id", entityId);
      if (deleteRulesErr) throw deleteRulesErr;

      const { error: deleteAssignmentsErr } = await supabaseAdmin
        .from("agent_company_assignments")
        .delete()
        .eq("company_id", entityId);
      if (deleteAssignmentsErr) throw deleteAssignmentsErr;

      const { error: deleteMembershipsErr } = await supabaseAdmin
        .from("company_memberships")
        .delete()
        .eq("company_id", entityId);
      if (deleteMembershipsErr) throw deleteMembershipsErr;

      const { error: deleteSubscriptionsErr } = await supabaseAdmin
        .from("company_subscriptions")
        .delete()
        .eq("company_id", entityId);
      if (deleteSubscriptionsErr) throw deleteSubscriptionsErr;

      const { error: clearTicketsCompanyErr } = await supabaseAdmin
        .from("tickets")
        .update({ company_id: null })
        .eq("company_id", entityId);
      if (clearTicketsCompanyErr) throw clearTicketsCompanyErr;

      const { error: deleteCompanyErr } = await supabaseAdmin
        .from("companies")
        .delete()
        .eq("id", entityId);
      if (deleteCompanyErr) throw deleteCompanyErr;

      return jsonResponse({ ok: true, message: "Company deleted" });
    }

    const targetUserId = entityId;

    if (entityType === "consultant") {
      console.log(`[delete] Checking consultant role for ${entityId}`);
      const { data: consultantRole, error: consultantRoleErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("user_id", entityId)
        .eq("role", "consultant")
        .limit(1)
        .maybeSingle();

      if (consultantRoleErr) throw consultantRoleErr;
      if (!consultantRole) return jsonResponse({ error: "Consultant not found" }, 404);
      console.log(`[delete] Consultant role verified`);
    }

    if (targetUserId === actorId) {
      return jsonResponse({ error: "You cannot delete your own account" }, 400);
    }

    console.log(`[delete] Checking if last admin...`);
    await ensureLastAdminNotDeleted(supabaseAdmin, targetUserId);

    console.log(`[delete] Fetching linked agents for user ${targetUserId}`);
    const { data: linkedAgents, error: linkedAgentsErr } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("user_id", targetUserId);
    if (linkedAgentsErr) throw linkedAgentsErr;

    if (linkedAgents && linkedAgents.length > 0) {
      console.log(`[delete] Found ${linkedAgents.length} linked agents, deleting them...`);
      for (const row of linkedAgents) {
        await deleteAgentEntity(supabaseAdmin, row.id);
      }
    }

    console.log(`[delete] Cleaning up user references...`);
    await cleanupRestrictiveUserReferences(supabaseAdmin, targetUserId, actorId);

    console.log(`[delete] Attempting to delete auth user ${targetUserId}...`);
    const { error: deleteUserErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteUserErr) {
      console.error(`[delete] Auth deletion failed:`, deleteUserErr);
      throw deleteUserErr;
    }

    console.log(`[delete] User ${targetUserId} successfully deleted`);
    return jsonResponse({ ok: true, message: entityType === "consultant" ? "Consultant deleted" : "User deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();

    if (lower.includes("unauthorized")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (lower.includes("forbidden")) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (lower.includes("not found")) {
      return jsonResponse({ error: message }, 404);
    }

    console.error("admin-delete-entity error:", message);
    console.error("admin-delete-entity full error:", err);
    return jsonResponse({ error: message || "Delete operation failed", details: message }, 500);
  }
});
