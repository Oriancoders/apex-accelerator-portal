import { Link } from "react-router-dom";
import { Cloud } from "lucide-react";
import type { FooterContactItem, FooterSocialLink } from "./types";

type BrandColumnProps = {
  contacts: FooterContactItem[];
  socialLinks: FooterSocialLink[];
};

export default function BrandColumn({ contacts, socialLinks }: BrandColumnProps) {
  return (
    <div className="col-span-2 md:col-span-1">
      <Link to="/dashboard" className="flex items-center gap-2.5 mb-4">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Cloud className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground text-lg tracking-tight">CustomerPortol</span>
      </Link>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[240px]">
        Expert task delivery with a pay-as-you-go model. No retainers, no monthly contracts.
      </p>

      <div className="space-y-2.5">
        {contacts.map((item) => {
          const content = (
            <>
              <item.icon className="h-3.5 w-3.5" /> {item.content}
            </>
          );

          if (item.href) {
            return (
              <a key={item.content} href={item.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {content}
              </a>
            );
          }

          return (
            <div key={item.content} className="flex items-center gap-2 text-sm text-muted-foreground">
              {content}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-5">
        {socialLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <s.icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
}
