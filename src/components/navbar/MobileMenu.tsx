import { type Dispatch, type SetStateAction } from "react";
import { ArrowRight, Building2, Check, Coins, DollarSign, History, LayoutDashboard, LogOut, Menu, Shield, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Membership, NavItem } from "./types";

type MobileMenuProps = {
  mobileOpen: boolean;
  setMobileOpen: Dispatch<SetStateAction<boolean>>;
  navItems: NavItem[];
  isActive: (path: string) => boolean;
  initials: string;
  isGuest: boolean;
  fullName?: string | null;
  email?: string | null;
  memberships: Membership[];
  setPrimaryPending: boolean;
  canWithdraw: boolean;
  canManageMembers: boolean;
  isAgent: boolean;
  companyDashboardPath: string;
  isAdmin: boolean;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  onSwitchCompany: (companyId: string) => void;
};

export default function MobileMenu({
  mobileOpen,
  setMobileOpen,
  navItems,
  isActive,
  initials,
  isGuest,
  fullName,
  email,
  memberships,
  setPrimaryPending,
  canWithdraw,
  canManageMembers,
  isAgent,
  companyDashboardPath,
  isAdmin,
  onNavigate,
  onSignOut,
  onSwitchCompany,
}: MobileMenuProps) {
  const navigateAndClose = (path: string) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className={`text-sm font-semibold ${isGuest ? "bg-warning/20 text-warning" : "bg-primary/10 text-primary"}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{isGuest ? "Guest" : fullName || "User"}</p>
              <p className="text-xs text-muted-foreground">{isGuest ? "Read-only" : email}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.to}
              onClick={() => navigateAndClose(item.to)}
              className={`flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium transition-all ${
                isActive(item.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}

          {!isGuest && (
            <>
              {memberships.length > 1 && (
                <>
                  <div className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Active Company
                  </div>
                  {memberships.map((m) => (
                    <button
                      key={m.company_id}
                      onClick={() => {
                        if (!m.is_primary) {
                          onSwitchCompany(m.company_id);
                        }
                        setMobileOpen(false);
                      }}
                      disabled={setPrimaryPending}
                      className={`flex items-center gap-3 w-full h-11 px-4 rounded-xl text-sm font-medium transition-all ${
                        m.is_primary
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="flex-1 text-left truncate">{m.companies?.name || m.company_id}</span>
                      {m.is_primary && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </>
              )}

              <button
                onClick={() => navigateAndClose("/credits")}
                className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Coins className="h-5 w-5" />
                Buy Credits
              </button>
              {canWithdraw && (
                <button
                  onClick={() => navigateAndClose("/credits#withdraw")}
                  className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Wallet className="h-5 w-5" />
                  Withdraw Credits
                </button>
              )}
              <button
                onClick={() => navigateAndClose("/pricing")}
                className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <DollarSign className="h-5 w-5" />
                Pricing Guide
              </button>
              {canManageMembers && (
                <button
                  onClick={() => navigateAndClose("/company/members")}
                  className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Building2 className="h-5 w-5" />
                  Company Members
                </button>
              )}
              {isAgent && (
                <button
                  onClick={() => navigateAndClose("/agent/dashboard")}
                  className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Agent Dashboard
                </button>
              )}
              {canManageMembers && (
                <button
                  onClick={() => navigateAndClose(companyDashboardPath)}
                  className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Building2 className="h-5 w-5" />
                  Company Dashboard
                </button>
              )}
              <button
                onClick={() => navigateAndClose("/credits#history")}
                className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <History className="h-5 w-5" />
                Transaction History
              </button>
            </>
          )}

          {isAdmin && !isGuest && (
            <button
              onClick={() => navigateAndClose("/admin")}
              className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <Shield className="h-5 w-5" />
              Admin Panel
            </button>
          )}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          {isGuest ? (
            <Button className="w-full h-12 rounded-xl font-semibold" onClick={() => navigateAndClose("/auth")}>
              Sign Up Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5" onClick={onSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
