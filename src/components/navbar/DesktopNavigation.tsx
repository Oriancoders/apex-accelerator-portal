import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { NavItem } from "./types";

type DesktopNavigationProps = {
  navItems: NavItem[];
  isActive: (path: string) => boolean;
};

export default function DesktopNavigation({ navItems, isActive }: DesktopNavigationProps) {
  return (
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
  );
}
