import { Link } from "react-router-dom";
import type { FooterLink } from "./types";

type FooterBottomBarProps = {
  bottomLinks: FooterLink[];
};

export default function FooterBottomBar({ bottomLinks }: FooterBottomBarProps) {
  return (
    <div className="border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CustomerPortol. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {bottomLinks.map((link) => (
            <Link key={link.label} to={link.to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
