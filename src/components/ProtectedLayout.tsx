import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { useAgentTenant } from "@/hooks/useAgentTenant";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const location = useLocation();
  const { isLoading: tenantLoading, isAgent, activeCompany } = useAgentTenant();

  // Stable loading check
  const isLoading = loading || tenantLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect to auth if not authenticated and not a guest
  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  // Check route-specific conditions
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAgentDashboard = location.pathname.startsWith("/agent/dashboard");
  const isCreditsRoute = location.pathname.startsWith("/credits");
  const isTicketRoute = location.pathname.startsWith("/tickets/");

  // Only redirect agents without a company if they're not already on an exempt route
  const shouldRedirectAgent = user && isAgent && !activeCompany && !isAdminRoute && !isAgentDashboard && !isCreditsRoute && !isTicketRoute;
  if (shouldRedirectAgent) {
    return <Navigate to="/agent/dashboard" replace />;
  }

  return (
    <div className="min-h-screen surface-base">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
