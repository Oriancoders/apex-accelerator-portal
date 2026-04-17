import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AccessDeniedRedirect from "@/components/admin-layout/AccessDeniedRedirect";
import AdminHeader from "@/components/admin-layout/AdminHeader";
import AdminSidebar from "@/components/admin-layout/AdminSidebar";

/*
 * HCI Principles Applied to Admin Layout:
 *
 * FITTS'S LAW: Large sidebar menu items (h-11), large mobile nav items (h-12),
 *   prominent sidebar trigger. Active route clearly highlighted.
 *
 * HICK'S LAW: Navigation limited to 6 items (within Miller's 7±2).
 *   Grouped into one section with clear labels.
 *
 * CHUNKING: Sidebar split into 2 groups — main nav + back action.
 *   Header contains only trigger + context info (no clutter).
 *
 * GESTALT Proximity: Nav items grouped tightly, "Back to Portal" separated.
 * GESTALT Similarity: All nav items share identical styling.
 * GESTALT Common Region: Sidebar is a distinct visual region.
 *
 * RESPONSIVE: Desktop shows sidebar, mobile uses Sheet drawer with
 *   large touch targets. Header adapts with breadcrumb-style context.
 */

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading admin panel…</span>
        </div>
      </div>
    );
  }

  if (isGuest) return <AccessDeniedRedirect to="/dashboard" message="Guest users cannot access the admin panel." />;
  if (!user) return <AccessDeniedRedirect to="/auth" message="Please sign in to access the admin panel." />;

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
