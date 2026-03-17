import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { useAgentTenant } from "@/hooks/useAgentTenant";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const location = useLocation();
  const { isLoading: tenantLoading, isAgent, activeCompany } = useAgentTenant();

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user && !isGuest) return <Navigate to="/auth" replace />;

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAgentDashboard = location.pathname.startsWith("/agent/dashboard");
  const isCreditsRoute = location.pathname.startsWith("/credits");

  if (user && isAgent && !activeCompany && !isAdminRoute && !isAgentDashboard && !isCreditsRoute) {
    return <Navigate to="/agent/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
