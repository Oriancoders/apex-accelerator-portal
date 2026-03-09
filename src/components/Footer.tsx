import { Link } from "react-router-dom";
import { Cloud, Mail, Phone, MapPin, ArrowUpRight, Linkedin, Twitter, Youtube } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Submit Ticket", to: "/tickets/new" },
    { label: "Buy Credits", to: "/credits" },
    { label: "Pricing Guide", to: "/pricing" },
  ],
  Resources: [
    { label: "Knowledge Base", to: "/knowledge" },
    { label: "Recipes", to: "/recipes" },
    { label: "News", to: "/news" },
    { label: "Extensions", to: "/extensions" },
  ],
  Company: [
    { label: "Why Choose Us", to: "/why-choose-us" },
    { label: "Get to Know Us", to: "/about" },
    { label: "AppExchange", to: "/appexchange" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/dashboard" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Cloud className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground text-lg tracking-tight">SF Services</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[240px]">
              Expert Salesforce support with a pay-as-you-go model. No retainers, no contracts.
            </p>
            <div className="space-y-2.5">
              <a href="mailto:support@sfservices.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-3.5 w-3.5" /> support@sfservices.com
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> +1 (555) 123-4567
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> San Francisco, CA
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
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
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SF Services. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
            <Link to="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
