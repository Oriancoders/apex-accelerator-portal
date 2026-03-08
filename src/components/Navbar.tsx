import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Cloud, Coins, LogOut, User, LayoutDashboard, Shield, Ticket, BookOpen, Menu, ArrowRight } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";

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
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = isGuest
    ? "G"
    : profile?.full_name
      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";

  // Hick's Law: fewer nav items for guests
  const navItems = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, show: true },
    { label: "My Tickets", to: "/tickets", icon: Ticket, show: !isGuest },
    { label: "Knowledge Base", to: "/knowledge", icon: BookOpen, show: true },
  ].filter((n) => n.show);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Chunk 1: Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Cloud className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-base hidden sm:inline tracking-tight">SF Services</span>
        </Link>

        {/* Chunk 2: Desktop Navigation — Gestalt Proximity, active state feedback */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              size="sm"
              asChild
              className={`h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Link to={item.to}>
                <item.icon className="h-4 w-4 mr-1.5" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Chunk 3: User actions */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Desktop dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Fitts's Law: Large round target */}
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={`text-sm font-semibold ${isGuest ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'}`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl" align="end" sideOffset={8}>
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold">{isGuest ? "Guest User" : profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{isGuest ? "Read-only access" : user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              {!isGuest && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="h-10 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/credits")} className="h-10 cursor-pointer">
                    <Coins className="mr-2 h-4 w-4" />
                    Buy Credits
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="h-10 cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleSignOut} className="h-10 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {isGuest ? "Exit Guest Mode" : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger — Fitts's Law: large touch target */}
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
                    <AvatarFallback className={`text-sm font-semibold ${isGuest ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{isGuest ? "Guest" : profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{isGuest ? "Read-only" : user?.email}</p>
                  </div>
                </div>
              </div>
              {/* Fitts's Law: Tall mobile nav items (h-12) for easy thumb reach */}
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => { navigate(item.to); setMobileOpen(false); }}
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
                  <button
                    onClick={() => { navigate("/credits"); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <Coins className="h-5 w-5" />
                    Buy Credits
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => { navigate("/admin"); setMobileOpen(false); }}
                    className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <Shield className="h-5 w-5" />
                    Admin Panel
                  </button>
                )}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                {isGuest ? (
                  <Button className="w-full h-12 rounded-xl font-semibold" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>
                    Sign Up Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
