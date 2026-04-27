import { Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import type { FooterContactItem, FooterLinksByGroup, FooterSocialLink } from "./types";

export const footerLinks: FooterLinksByGroup = {
  Platform: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Submit Ticket", to: "/tickets/new" },
    { label: "Buy Credits", to: "/credits" },
    { label: "Pricing Guide", to: "/pricing" },
    { label: "Help Center", to: "/help" },
  ],
  Resources: [
    { label: "How It Works", to: "/help" },
    { label: "Support", to: "/about" },
  ],
  Company: [
    { label: "Get to Know Us", to: "/about" },
    { label: "Contact", to: "/about" },
  ],
};

export const footerContactItems: FooterContactItem[] = [
  { icon: Mail, content: "support@customerconnect.com", href: "mailto:support@customerconnect.com" },
  { icon: Phone, content: "+1 (555) 123-4567" },
  { icon: MapPin, content: "Remote-first" },
];

export const footerSocialLinks: FooterSocialLink[] = [
  { icon: Linkedin, href: "https://linkedin.com/company/shiftdeploy", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/shiftdeploy", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com/@shiftdeploy", label: "YouTube" },
];

export const footerBottomLinks = [
  { label: "Privacy", to: "/about" },
  { label: "Terms", to: "/about" },
  { label: "Contact", to: "/about" },
];
