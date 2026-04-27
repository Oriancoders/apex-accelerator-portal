import { supabase } from "@/integrations/supabase/client";
import { emailSchema, safeTextSchema, uuidSchema } from "@/lib/validation";

export type InviteMemberRole = "admin" | "member" | "owner" | "billing";

export type InviteMemberResponse = {
  ok?: boolean;
  created?: boolean;
  membershipCreated?: boolean;
  membershipRoleUpdated?: boolean;
  membershipRole?: InviteMemberRole;
  resetEmailSent?: boolean;
  error?: string;
};

async function readFunctionError(error: unknown) {
  const context = (error as { context?: Response })?.context;

  if (context && typeof context.clone === "function") {
    try {
      const payload = (await context.clone().json()) as InviteMemberResponse;
      if (payload?.error) return payload.error;
    } catch {
      // Fall back to the SDK error message below.
    }
  }

  return error instanceof Error ? error.message : "Unable to invite member.";
}

export async function inviteCompanyMember(args: {
  companyId: string;
  fullName: string;
  email: string;
  membershipRole: InviteMemberRole;
}) {
  const companyId = uuidSchema.parse(args.companyId);
  const fullName = safeTextSchema(120, 1).parse(args.fullName);
  const email = emailSchema.parse(args.email);
  const membershipRole = args.membershipRole;
  if (!["admin", "member", "owner", "billing"].includes(membershipRole)) {
    throw new Error("Invalid membership role.");
  }

  const { data, error } = await supabase.functions.invoke<InviteMemberResponse>("invite-member", {
    body: {
      companyId,
      fullName,
      email,
      membershipRole,
    },
  });

  if (error) {
    throw new Error(await readFunctionError(error));
  }

  if (!data?.ok) {
    throw new Error(data?.error || "Unable to invite member.");
  }

  return data;
}

export function getInviteResultMessage(data: InviteMemberResponse) {
  if (data.created && data.resetEmailSent) {
    return "User created and password setup email sent.";
  }

  if (data.membershipRoleUpdated && data.resetEmailSent) {
    return "Password reset email sent and member role updated.";
  }

  if (data.membershipCreated && data.resetEmailSent) {
    return "Password reset email sent and member added.";
  }

  if (data.resetEmailSent) {
    return "Password reset email sent.";
  }

  return data.membershipRoleUpdated ? "Member role updated." : "Member added to company.";
}
