import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Menu, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { adminAccordionDefaultOpen, adminNavGroups } from "@/components/admin-layout/navData";
import { useAdminUnreadCount } from "@/components/admin-layout/useAdminUnreadCount";

export default function MobileAdminNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useAdminUnreadCount();

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
        <div className="p-5 border-b border-border-subtle">
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

        <nav className="p-3 pb-24 overflow-y-auto max-h-[calc(100vh-140px)]">
          <Accordion type="multiple" defaultValue={adminAccordionDefaultOpen} className="w-full space-y-4">
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
                      className={`flex items-center gap-3 w-full h-12 px-4 rounded-ds-md text-sm font-medium transition-all ${
                        isActive(item.url)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Notifications" && unreadCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 min-w-5 rounded-full">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-subtle">
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 w-full h-12 px-4 rounded-ds-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Portal
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
