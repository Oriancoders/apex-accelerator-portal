import { supabase } from "@/integrations/supabase/client";
import { boundedNumberSchema, emailSchema, safeTextSchema } from "@/lib/validation";

export type AdminRegisterUserRole = "admin" | "agent" | "consultant" | "member";

export type AdminRegisterUserResponse = {
  success?: boolean;
  userId?: string;
  created?: boolean;
  role?: AdminRegisterUserRole;
  agentCreated?: boolean;
  resetEmailSent?: boolean;
  error?: string;
};

async function readFunctionError(error: unknown) {
  const context = (error as { context?: Response })?.context;

  if (context && typeof context.clone === "function") {
    try {
      const payload = (await context.clone().json()) as AdminRegisterUserResponse;
      if (payload?.error) return payload.error;
    } catch {
      // Fall through to the SDK error message.
    }
  }

  return error instanceof Error ? error.message : "Unable to add user.";
}

export async function adminRegisterUser(args: {
  fullName: string;
  email: string;
  role: AdminRegisterUserRole;
  commissionPercent?: string;
}) {
  const fullName = safeTextSchema(120, 1).parse(args.fullName);
  const email = emailSchema.parse(args.email);
  const role = args.role;

  if (!["admin", "agent", "consultant", "member"].includes(role)) {
    throw new Error("Invalid role.");
  }

  const commissionPercent =
    role === "agent"
      ? boundedNumberSchema(0, 100).parse(args.commissionPercent || "15")
      : undefined;

  const redirectTo = `${window.location.origin}/reset-password`;
  const { data, error } = await supabase.functions.invoke<AdminRegisterUserResponse>("auth-guard", {
    body: {
      action: "admin_register",
      fullName,
      email,
      role,
      commissionPercent,
      redirectTo,
    },
  });

  if (error) {
    throw new Error(await readFunctionError(error));
  }

  if (!data?.success) {
    throw new Error(data?.error || "Unable to add user.");
  }

  return data;
}

export function getAdminRegisterUserMessage(data: AdminRegisterUserResponse) {
  const roleLabel =
    data.role === "agent"
      ? "Partner"
      : data.role === "consultant"
        ? "Consultant"
        : data.role === "admin"
          ? "Admin"
          : "Member";

  if (data.created) {
    return `${roleLabel} account created and password setup email sent.`;
  }

  return `${roleLabel} role saved and password setup email sent.`;
}
