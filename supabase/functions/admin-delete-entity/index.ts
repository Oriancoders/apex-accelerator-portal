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
  const cleanupErrors: string[] = [];

  const ignoreMissingRelation = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("Could not find the table") ||
      message.includes("does not exist") ||
      message.includes("schema cache");
  };

  const runOptionalCleanup = async (label: string, action: () => any) => {
    const { error } = await action();
    if (!error) return;
    if (ignoreMissingRelation(error)) {
      console.warn(`[cleanup] Optional cleanup skipped for ${label}:`, error);
      return;
    }
    console.error(`[cleanup] ${label} failed:`, error);
    cleanupErrors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  };

  await runOptionalCleanup("reassign companies", () =>
    supabaseAdmin
      .from("companies")
      .update({ created_by: actorId })
      .eq("created_by", targetUserId)
  );

  await runOptionalCleanup("reassign assignments", () =>
    supabaseAdmin
      .from("agent_company_assignments")
      .update({ created_by: actorId })
      .eq("created_by", targetUserId)
  );

  await runOptionalCleanup("reassign commission rules", () =>
    supabaseAdmin
      .from("commission_rules")
      .update({ created_by: actorId })
      .eq("created_by", targetUserId)
  );

  await runOptionalCleanup("clear ticket updates user", () =>
    supabaseAdmin
      .from("ticket_updates")
      .update({ user_id: null })
      .eq("user_id", targetUserId)
  );

  await runOptionalCleanup("clear ticket assignment", () =>
    supabaseAdmin
      .from("tickets")
      .update({
        assigned_consultant_id: null,
        assignment_status: null,
        assigned_at: null,
        consultant_accepted_at: null,
        consultant_completed_at: null,
      })
      .eq("assigned_consultant_id", targetUserId)
  );

  await runOptionalCleanup("clear notifications user", () =>
    supabaseAdmin
      .from("notifications")
      .update({ user_id: null })
      .eq("user_id", targetUserId)
  );

  await runOptionalCleanup("clear chat messages user", () =>
    supabaseAdmin
      .from("chat_messages")
      .update({ user_id: null })
      .eq("user_id", targetUserId)
  );

  await runOptionalCleanup("clear ticket events actor", () =>
    supabaseAdmin
      .from("ticket_events")
      .update({ changed_by: null })
      .eq("changed_by", targetUserId)
  );

  await runOptionalCleanup("delete ticket reviews", () =>
    supabaseAdmin
      .from("ticket_reviews")
      .delete()
      .eq("user_id", targetUserId)
  );

  await runOptionalCleanup("clear invited memberships", () =>
    supabaseAdmin
      .from("company_memberships")
      .update({ invited_by: null })
      .eq("invited_by", targetUserId)
  );

  await runOptionalCleanup("clear onboarded agents", () =>
    supabaseAdmin
      .from("agents")
      .update({ onboarded_by: null })
      .eq("onboarded_by", targetUserId)
  );

  await runOptionalCleanup("clear component visibility updater", () =>
    supabaseAdmin
      .from("company_component_visibility")
      .update({ updated_by: null })
      .eq("updated_by", targetUserId)
  );

  await runOptionalCleanup("clear withdrawal processor", () =>
    supabaseAdmin
      .from("credit_withdrawal_requests")
      .update({ processed_by: null })
      .eq("processed_by", targetUserId)
  );

  await runOptionalCleanup("clear subscription purchaser", () =>
    supabaseAdmin
      .from("company_subscriptions")
      .update({ purchased_by: null })
      .eq("purchased_by", targetUserId)
  );

  if (cleanupErrors.length > 0) {
    console.warn(`[cleanup] Cleanup completed with warnings:`, cleanupErrors);
  } else {
    console.log(`[cleanup] Cleanup completed successfully`);
  }

  return cleanupErrors;
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

async function cleanupDeletedUserSurface(
  supabaseAdmin: ReturnType<typeof createClient>,
  targetUserId: string,
) {
  const cleanupErrors: string[] = [];
  const cleanupSteps = [
    {
      label: "delete profile",
      run: () => supabaseAdmin.from("profiles").delete().eq("user_id", targetUserId),
    },
    {
      label: "delete role",
      run: () => supabaseAdmin.from("user_roles").delete().eq("user_id", targetUserId),
    },
    {
      label: "delete company memberships",
      run: () => supabaseAdmin.from("company_memberships").delete().eq("user_id", targetUserId),
    },
  ];

  for (const step of cleanupSteps) {
    const { error } = await step.run();
    if (error) {
      console.error(`[delete-surface] ${step.label} failed:`, error);
      cleanupErrors.push(`${step.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return cleanupErrors;
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

    const linkedAgentCleanupErrors: string[] = [];
    if (linkedAgents && linkedAgents.length > 0) {
      console.log(`[delete] Found ${linkedAgents.length} linked agents, deleting them...`);
      for (const row of linkedAgents) {
        try {
          await deleteAgentEntity(supabaseAdmin, row.id);
        } catch (agentDeleteErr) {
          const agentDeleteMessage = agentDeleteErr instanceof Error ? agentDeleteErr.message : String(agentDeleteErr);
          console.error(`[delete] Linked agent cleanup failed for ${row.id}:`, agentDeleteErr);
          linkedAgentCleanupErrors.push(`linked agent ${row.id}: ${agentDeleteMessage}`);
        }
      }
    }

    console.log(`[delete] Removing user from admin-visible app tables...`);
    const surfaceCleanupErrors = await cleanupDeletedUserSurface(supabaseAdmin, targetUserId);

    console.log(`[delete] Cleaning up user references...`);
    const referenceCleanupErrors = await cleanupRestrictiveUserReferences(supabaseAdmin, targetUserId, actorId);

    console.log(`[delete] Attempting to delete auth user ${targetUserId}...`);
    const { error: deleteUserErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteUserErr) {
      console.error(`[delete] Auth deletion failed:`, deleteUserErr);

      const deleteMessage = deleteUserErr.message || String(deleteUserErr);
      if (deleteMessage.toLowerCase().includes("not found")) {
        return jsonResponse({
          ok: true,
          message: entityType === "consultant" ? "Consultant deleted" : "User deleted",
          deletionMode: "local-cleanup",
          warnings: [...linkedAgentCleanupErrors, ...surfaceCleanupErrors, ...referenceCleanupErrors],
        });
      }

      console.warn(`[delete] Falling back to soft delete for auth user ${targetUserId}...`);
      const { error: softDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId, true);
      if (softDeleteErr) {
        console.error(`[delete] Auth soft deletion failed:`, softDeleteErr);
        return jsonResponse({
          ok: true,
          message: entityType === "consultant" ? "Consultant removed from app" : "User removed from app",
          deletionMode: "app-cleanup-only",
          warnings: [
            ...surfaceCleanupErrors,
            ...linkedAgentCleanupErrors,
            ...referenceCleanupErrors,
            `hard auth delete failed: ${deleteMessage}`,
            `soft auth delete failed: ${softDeleteErr.message || String(softDeleteErr)}`,
          ],
        });
      }

      return jsonResponse({
        ok: true,
        message: entityType === "consultant" ? "Consultant deleted" : "User deleted",
        deletionMode: "soft-delete",
        warnings: [...linkedAgentCleanupErrors, ...surfaceCleanupErrors, ...referenceCleanupErrors, `hard auth delete failed: ${deleteMessage}`],
      });
    }

    console.log(`[delete] User ${targetUserId} successfully deleted`);
    return jsonResponse({
      ok: true,
      message: entityType === "consultant" ? "Consultant deleted" : "User deleted",
      deletionMode: "hard-delete",
      warnings: [...linkedAgentCleanupErrors, ...surfaceCleanupErrors, ...referenceCleanupErrors],
    });
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
