import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { useUserRole } from "@/hooks/useUserRole";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coins, Info, Ticket } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { toast } from "sonner";
import { getUserFacingError } from "@/lib/errors";
import BrandLink from "@/components/navbar/BrandLink";
import CompanySwitcher from "@/components/navbar/CompanySwitcher";
import DesktopNavigation from "@/components/navbar/DesktopNavigation";
import MobileMenu from "@/components/navbar/MobileMenu";
import UserDropdownMenu from "@/components/navbar/UserDropdownMenu";
import { getInitials } from "@/components/navbar/getInitials";
import type { Membership, NavItem } from "@/components/navbar/types";

/*
 * HCI Principles:
 * FITTS'S LAW: Large touch targets (h-10 nav items, h-12 mobile menu items)
 * HICK'S LAW: Max 4 nav items visible; guest sees fewer (reduced choices)
 * CHUNKING: Nav split into 3 chunks — brand | navigation | user actions
 * GESTALT Proximity: Related items grouped (nav links together, user actions together)
 * KLM: Active route highlighted — no scanning needed to find current location
 */

export default function Navbar() {
  const { user, profile, signOut, isGuest } = useAuth();
  const { isAdmin } = useAdminRole();
  const { role } = useUserRole();
  const { isAgent, memberships, activeCompany, activeMembership } = useAgentTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const companyDashboardPath = activeCompany?.slug ? `/${activeCompany.slug}/dashboard` : "/dashboard";

  const setPrimaryCompany = useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase.rpc("set_primary_company", { p_company_id: companyId });
      if (error) throw error;
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ["company-memberships", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["company-component-visibility"] });

      const selectedMembership = memberships.find((m) => m.company_id === companyId);
      const selectedSlug = selectedMembership?.companies?.slug;

      // Keep URL aligned with active company when user is on company-scoped pages.
      if (selectedSlug) {
        const path = location.pathname;

        // Handle current slug routes and preserve the rest of the path.
        const scopedMatch = path.match(/^\/[^/]+\/(dashboard|settings|tickets(?:\/new|\/[^/]+)?)$/);
        if (scopedMatch) {
          const nextPath = `/${selectedSlug}/${scopedMatch[1]}${location.search}${location.hash}`;
          if (`${path}${location.search}${location.hash}` !== nextPath) {
            navigate(nextPath, { replace: true });
          }
        }

        // Handle legacy non-slug pages still present in older navigation paths.
        if (path === "/company/dashboard") {
          navigate(`/${selectedSlug}/dashboard`, { replace: true });
        } else if (path === "/company/settings") {
          navigate(`/${selectedSlug}/settings`, { replace: true });
        } else if (path === "/company/tickets") {
          navigate(`/${selectedSlug}/tickets`, { replace: true });
        }
      }

      toast.success("Active company switched");
    },
    onError: (err: Error) => toast.error(getUserFacingError(err, "Unable to switch active company right now.")),
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = isGuest ? "G" : getInitials(profile?.full_name);

  const ticketListPath =
    (role === "company_admin" || role === "member") && activeCompany?.slug
      ? `/${activeCompany.slug}/tickets`
      : "/tickets";

  // Hick's Law: fewer nav items for guests
  const navItems: NavItem[] = [
    ...(isGuest ? [] : [{ label: "My Tickets", to: ticketListPath, icon: Ticket }]),
    { label: "Get to Know Us", to: "/about", icon: Info },
  ];

  const isActive = (path: string) => location.pathname === path;
  const canManageMembers = !isGuest && (isAdmin || activeMembership?.role === "owner" || activeMembership?.role === "admin");
  const canWithdraw = !isGuest && (role === "agent" || role === "company_admin" || role === "member");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        <BrandLink />

        <DesktopNavigation navItems={navItems} isActive={isActive} />

        <div className="flex items-center gap-2 sm:gap-3">
          {!isGuest && (
            <CompanySwitcher
              memberships={memberships as Membership[]}
              activeCompanyName={activeCompany?.name}
              isPending={setPrimaryCompany.isPending}
              onSwitch={(companyId) => setPrimaryCompany.mutate(companyId)}
            />
          )}

          {isGuest && (
            <Button
              variant="default"
              size="sm"
              className="hidden sm:flex gap-1.5 h-9 rounded-lg text-xs font-semibold"
              onClick={() => navigate("/auth")}
            >
              Sign Up Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {isGuest && (
            <div className="flex items-center gap-1.5 bg-warning/10 px-2.5 py-1 rounded-full sm:hidden">
              <span className="text-[10px] font-bold text-warning uppercase tracking-wider">Guest</span>
            </div>
          )}

          {profile && !isGuest && (
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <Coins className="h-3.5 w-3.5 text-accent" />
              <span className="text-sm font-bold text-foreground">{profile.credits}</span>
              <span className="text-xs text-muted-foreground hidden lg:inline">credits</span>
            </div>
          )}

          {!isGuest && <NotificationBell />}

          <UserDropdownMenu
            initials={initials}
            isGuest={isGuest}
            fullName={profile?.full_name}
            email={user?.email}
            isAdmin={isAdmin}
            canWithdraw={canWithdraw}
            canManageMembers={canManageMembers}
            isAgent={isAgent}
            companyDashboardPath={companyDashboardPath}
            onNavigate={navigate}
            onSignOut={handleSignOut}
          />

          <MobileMenu
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            navItems={navItems}
            isActive={isActive}
            initials={initials}
            isGuest={isGuest}
            fullName={profile?.full_name}
            email={user?.email}
            memberships={memberships as Membership[]}
            setPrimaryPending={setPrimaryCompany.isPending}
            canWithdraw={canWithdraw}
            canManageMembers={canManageMembers}
            isAgent={isAgent}
            companyDashboardPath={companyDashboardPath}
            isAdmin={isAdmin}
            onNavigate={navigate}
            onSignOut={handleSignOut}
            onSwitchCompany={(companyId) => setPrimaryCompany.mutate(companyId)}
          />
        </div>
      </div>
    </header>
  );
}
