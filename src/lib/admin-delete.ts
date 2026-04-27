import { supabase } from "@/integrations/supabase/client";

export type AdminDeleteEntityType = "user" | "consultant" | "agent" | "company";

type AdminDeleteResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

async function readFunctionError(error: unknown) {
  const context = (error as { context?: Response })?.context;

  if (context && typeof context.clone === "function") {
    try {
      const payload = (await context.clone().json()) as AdminDeleteResponse;
      if (payload?.error) return payload.error;
    } catch {
      // Fall back to the SDK error message below.
    }
  }

  return error instanceof Error ? error.message : "Delete request failed.";
}

export async function adminDeleteEntity(args: {
  entityType: AdminDeleteEntityType;
  entityId: string;
}) {
  const { data, error } = await supabase.functions.invoke<AdminDeleteResponse>("admin-delete-entity", {
    body: {
      entityType: args.entityType,
      entityId: args.entityId,
    },
  });

  if (error) {
    throw new Error(await readFunctionError(error));
  }

  if (!data?.ok) {
    throw new Error(data?.error || "Delete request failed.");
  }

  return data;
}
