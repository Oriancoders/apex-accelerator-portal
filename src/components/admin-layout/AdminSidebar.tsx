import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NavLink } from "@/components/NavLink";
import { adminAccordionDefaultOpen, adminNavGroups } from "@/components/admin-layout/navData";
import { useAdminUnreadCount } from "@/components/admin-layout/useAdminUnreadCount";

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { data: unreadCount = 0 } = useAdminUnreadCount();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border hidden md:flex">
      <SidebarContent className="py-2">
        <div className="flex items-center gap-2 px-4 py-4 mb-2">
          <Shield className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && <span className="font-bold text-base tracking-wide">Admin Panel</span>}
        </div>

        <Accordion type="multiple" defaultValue={adminAccordionDefaultOpen} className="w-full">
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
                            <NavLink
                              to={item.url}
                              end={item.url === "/admin"}
                              className="hover:bg-sidebar-accent hover:text-sidebar-foreground min-h-[44px] rounded-lg mx-2 px-3 transition-colors"
                              activeClassName="bg-primary/10 text-primary font-semibold"
                            >
                              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                              {!collapsed && <span className="flex-1 text-sm">{item.title}</span>}
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="hover:bg-sidebar-accent/50 text-sidebar-foreground/70 min-h-[44px] rounded-ds-md mx-1 px-3">
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
