import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cloud, Coins, LogOut, User, LayoutDashboard, Shield } from "lucide-react";

export default function Navbar() {
  const { user, profile, signOut, isGuest } = useAuth();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = isGuest
    ? "G"
    : profile?.full_name
      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground text-lg hidden sm:inline">SF Services</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tickets">My Tickets</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/knowledge">Knowledge Base</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <Coins className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">{profile.credits}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">credits</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/credits")}>
                <Coins className="mr-2 h-4 w-4" />
                Buy Credits
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
