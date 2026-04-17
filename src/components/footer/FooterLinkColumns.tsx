import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { FooterLinksByGroup } from "./types";

type FooterLinkColumnsProps = {
  groups: FooterLinksByGroup;
};

export default function FooterLinkColumns({ groups }: FooterLinkColumnsProps) {
  return (
    <>
      {Object.entries(groups).map(([title, links]) => (
        <div key={title}>
          <h4 className="font-semibold text-foreground text-sm mb-4 uppercase tracking-wider">{title}</h4>
          <ul className="space-y-2.5">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                >
                  {link.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x--0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
