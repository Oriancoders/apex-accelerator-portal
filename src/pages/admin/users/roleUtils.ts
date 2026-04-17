import type { AppRole } from "@/pages/admin/users/types";

export function roleBadgeVariant(role: AppRole | undefined) {
  if (role === "admin") return "default" as const;
  if (role === "company_admin") return "secondary" as const;
  if (role === "agent") return "outline" as const;
  return "secondary" as const;
}

export function roleLabel(role: AppRole | undefined) {
  if (!role) return "member";
  if (role === "company_admin") return "companyAdmin";
  if (role === "agent") return "Partner";
  return role;
}
