import { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAgentTenant } from "@/hooks/useAgentTenant";

type GuardPolicy = "admin" | "agent" | "company_dashboard" | "company_manage";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Checking permissions...</div>
    </div>
  );
}

export default function RoleAccessGuard({ policy, children }: { policy: GuardPolicy; children: ReactNode }) {
  const { user, isGuest, loading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const { isAgent, memberships, activeMembership, isLoading: tenantLoading } = useAgentTenant();
  const { slug } = useParams<{ slug: string }>();

  if (loading || roleLoading || tenantLoading) return <LoadingScreen />;

  if (!user && !isGuest) return <Navigate to="/auth" replace />;
  if (isGuest) return <Navigate to="/dashboard" replace />;

  if (policy === "admin") {
    if (role !== "admin") return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  }

  if (policy === "agent") {
    if (!isAgent) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  }

  const targetMembership = slug
    ? memberships.find((m) => m.companies?.slug === slug)
    : activeMembership;

  if (policy === "company_dashboard") {
    // System admins may access any company page.
    if (role === "admin") return <>{children}</>;

    // Company members/company admins can open company dashboard pages.
    if (role !== "company_admin" && role !== "member") return <Navigate to="/dashboard" replace />;
    if (!targetMembership) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
  }

  if (policy === "company_manage") {
    // System admins may access any company management page.
    if (role === "admin") return <>{children}</>;

    // Management pages are for company_admin only.
    if (role !== "company_admin") return <Navigate to="/dashboard" replace />;
    if (!targetMembership) return <Navigate to="/dashboard" replace />;

    // Must be elevated membership inside target company.
    if (targetMembership.role !== "owner" && targetMembership.role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  }

  return <Navigate to="/dashboard" replace />;
}
