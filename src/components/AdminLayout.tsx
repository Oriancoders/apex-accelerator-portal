import { ReactNode, useState, useEffect } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, useSidebar, SidebarInset
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Ticket, Users, FileText, Coins, Shield, ArrowLeft, Menu, Lightbulb, Package, Newspaper, Chrome, MessageSquare, UserCog, SlidersHorizontal, Handshake, UsersRound } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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

const adminNavGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    label: "Communications",
    items: [
      { title: "Tickets", url: "/admin/tickets", icon: Ticket },
      { title: "Contacts", url: "/admin/contacts", icon: MessageSquare },
    ]
  },
  {
    label: "Administration",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Agents", url: "/admin/agents", icon: UserCog },
      { title: "Company Members", url: "/admin/company-members", icon: UsersRound },
      { title: "Credits", url: "/admin/credits", icon: Coins },
      { title: "Company Components", url: "/admin/company-components", icon: SlidersHorizontal },
    ]
  },
  {
    label: "Content Management",
    items: [
      { title: "Articles", url: "/admin/articles", icon: FileText },
      { title: "Recipes", url: "/admin/recipes", icon: Lightbulb },
      { title: "AppExchange", url: "/admin/appexchange", icon: Package },
      { title: "News", url: "/admin/news", icon: Newspaper },
      { title: "Extensions", url: "/admin/extensions", icon: Chrome },
    ]
  }
];

const allAdminItems = adminNavGroups.flatMap(group => group.items);

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["admin-unread-notifications"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      return count || 0;
    },
    refetchInterval: 15000,
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border hidden md:flex">
      <SidebarContent className="py-2">
        {/* Brand Header */}
        <div className="flex items-center gap-2 px-4 py-4 mb-2">
          <Shield className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && <span className="font-bold text-base tracking-wide">Admin Panel</span>}
        </div>

        {/* Chunking: Grouped Navigation Sections (Miller's Law) */}
        <Accordion type="multiple" defaultValue={['Overview', 'Communications', 'Administration', 'Content Management']} className="w-full">
          {adminNavGroups.map((group) => (
            <AccordionItem value={group.label} key={group.label} className="border-none">
              <SidebarGroup className="py-0">
                <SidebarGroupLabel asChild className="group/label text-xs w-full hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors px-4 py-2">
                  <AccordionTrigger className={`flex items-center w-full py-0 hover:no-underline ${collapsed ? "[&>svg]:hidden" : ""}`}>
                    {!collapsed && <span className="font-semibold">{group.label}</span>}
                  </AccordionTrigger>
                </SidebarGroupLabel>
                <AccordionContent className="pb-0">
                  <SidebarGroupContent>
                    <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          {/* Fitts's Law: Tall menu items for easy clicking, clear hover states */}
                          <NavLink
                            to={item.url}
                            end={item.url === "/admin"}
                            className="hover:bg-sidebar-accent hover:text-sidebar-foreground min-h-[44px] rounded-lg mx-2 px-3 transition-colors"
                            activeClassName="bg-primary/10 text-primary font-semibold"
                          >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            {!collapsed && (
                              <span className="flex-1 text-sm">{item.title}</span>
                            )}
                            {item.title === "Notifications" && unreadCount > 0 && !collapsed && (
                              <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full">
                                {unreadCount}
                              </Badge>
                            )}
                            {item.title === "Notifications" && unreadCount > 0 && collapsed && (
                              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </AccordionContent>
            </SidebarGroup>
          </AccordionItem>
        ))}
        </Accordion>

        {/* Chunk 2: Back action — separated (Gestalt Proximity) */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="hover:bg-sidebar-accent/50 text-sidebar-foreground/70 min-h-[44px] rounded-xl mx-1 px-3">
                    <ArrowLeft className="mr-3 h-4 w-4" />
                    {!collapsed && <span className="text-sm">Back to Portal</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function MobileAdminNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["admin-unread-notifications"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      return count || 0;
    },
    refetchInterval: 15000,
  });

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">Admin Panel</p>
              <p className="text-xs text-muted-foreground">Management Console</p>
            </div>
          </div>
        </div>
        {/* Fitts's Law: Tall mobile nav items (h-12) and Hick's Law: Chunking */}
        <nav className="p-3 pb-24 overflow-y-auto max-h-[calc(100vh-140px)]">
          <Accordion type="multiple" defaultValue={['Overview', 'Communications', 'Administration', 'Content Management']} className="w-full space-y-4">
            {adminNavGroups.map((group) => (
              <AccordionItem value={group.label} key={group.label} className="border-none">
                <AccordionTrigger className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline">
                  {group.label}
                </AccordionTrigger>
                <AccordionContent className="space-y-1 pb-0 pt-0">
                  {group.items.map((item) => (
                    <Link
                      key={item.url}
                      to={item.url}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium transition-all ${
                        isActive(item.url)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Notifications" && unreadCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 min-w-5 rounded-full">{unreadCount}</Badge>
                      )}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 w-full h-12 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Portal
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AdminHeader() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Recognition > Recall: Show current page name in header
  const currentPage = allAdminItems.find((item) =>
    item.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.url)
  );

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  return (
    <header className="h-14 sm:h-16 flex items-center border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 sticky top-0 z-50">
      <MobileAdminNav />
      <SidebarTrigger className="mr-3 hidden md:flex" />

      {/* Chunking: Breadcrumb-style context */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Shield className="h-4 w-4 text-primary flex-shrink-0 hidden sm:block" />
        <span className="text-sm text-muted-foreground hidden sm:inline">/</span>
        <span className="text-sm font-semibold text-foreground truncate">
          {currentPage?.title || "Admin"}
        </span>
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
          <DropdownMenuContent align="end" className="w-44 rounded-xl">
            <DropdownMenuItem className="h-10 cursor-pointer" onClick={() => navigate("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer" onClick={() => navigate("/dashboard")}>
              Portal Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function AccessDeniedRedirect({ to, message }: { to: string; message: string }) {
  const { toast } = useToast();
  useEffect(() => {
    toast({
      title: "Access Denied",
      description: message,
      variant: "destructive",
    });
  }, []);
  return <Navigate to={to} replace />;
}

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
