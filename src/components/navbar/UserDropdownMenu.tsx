import { Coins, DollarSign, Building2, History, LayoutDashboard, LogOut, Shield, User, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserDropdownProps = {
  initials: string;
  isGuest: boolean;
  fullName?: string | null;
  email?: string | null;
  isAdmin: boolean;
  canWithdraw: boolean;
  canManageMembers: boolean;
  isAgent: boolean;
  isConsultant: boolean;
  companyDashboardPath: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
};

export default function UserDropdownMenu({
  initials,
  isGuest,
  fullName,
  email,
  isAdmin,
  canWithdraw,
  canManageMembers,
  isAgent,
  isConsultant,
  companyDashboardPath,
  onNavigate,
  onSignOut,
}: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="relative h-10 w-10 rounded-full p-0 inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={`text-sm font-semibold ${isGuest ? "bg-warning/20 text-warning" : "bg-primary/10 text-primary"}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-ds-md" align="end" sideOffset={8}>
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold">{isGuest ? "Guest User" : fullName || "User"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{isGuest ? "Read-only access" : email}</p>
        </div>
        <DropdownMenuSeparator />
        {!isGuest && (
          <>
            <DropdownMenuItem onClick={() => onNavigate("/profile")} className="h-10 cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate("/credits")} className="h-10 cursor-pointer">
              <Coins className="mr-2 h-4 w-4" />
              Buy Credits
            </DropdownMenuItem>
            {canWithdraw && (
              <DropdownMenuItem onClick={() => onNavigate("/credits#withdraw")} className="h-10 cursor-pointer">
                <Wallet className="mr-2 h-4 w-4" />
                Withdraw Credits
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onNavigate("/pricing")} className="h-10 cursor-pointer">
              <DollarSign className="mr-2 h-4 w-4" />
              Pricing Guide
            </DropdownMenuItem>
            {canManageMembers && (
              <DropdownMenuItem onClick={() => onNavigate("/company/members")} className="h-10 cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                Company Access
              </DropdownMenuItem>
            )}
            {isAgent && (
              <DropdownMenuItem onClick={() => onNavigate("/agent/dashboard")} className="h-10 cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Agent Dashboard
              </DropdownMenuItem>
            )}
            {isConsultant && (
              <DropdownMenuItem onClick={() => onNavigate("/consultant/dashboard")} className="h-10 cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Consultant Dashboard
              </DropdownMenuItem>
            )}
            {canManageMembers && (
              <DropdownMenuItem onClick={() => onNavigate(companyDashboardPath)} className="h-10 cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                Company Dashboard
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onNavigate("/credits#history")} className="h-10 cursor-pointer">
              <History className="mr-2 h-4 w-4" />
              Transaction History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {isAdmin && !isGuest && (
          <>
            <DropdownMenuItem onClick={() => onNavigate("/admin")} className="h-10 cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onSignOut} className="h-10 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {isGuest ? "Exit Guest Mode" : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
