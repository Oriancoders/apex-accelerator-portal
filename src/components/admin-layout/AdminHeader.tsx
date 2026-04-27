import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import MobileAdminNav from "@/components/admin-layout/MobileAdminNav";
import { allAdminItems } from "@/components/admin-layout/navData";
import { getInitials } from "@/components/admin-layout/getInitials";

export default function AdminHeader() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully.");
    navigate("/auth");
  };

  const currentPage = allAdminItems.find((item) =>
    item.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.url)
  );

  const initials = getInitials(profile?.full_name);

  return (
    <header className="h-14 sm:h-16 flex items-center border-b border-border-subtle bg-card/80 backdrop-blur-md px-4 sm:px-6 sticky top-0 z-50">
      <MobileAdminNav />
      <SidebarTrigger className="mr-3 hidden md:flex" />

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Shield className="h-4 w-4 text-primary flex-shrink-0 hidden sm:block" />
        <span className="text-sm text-muted-foreground hidden sm:inline">/</span>
        <span className="text-sm font-semibold text-foreground truncate">{currentPage?.title || "Admin"}</span>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open admin user menu"
              title="Admin menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-ds-md">
            <DropdownMenuItem className="h-10 cursor-pointer" onClick={() => navigate("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer" onClick={() => navigate("/dashboard")}>
              Portal Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="h-10 cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
