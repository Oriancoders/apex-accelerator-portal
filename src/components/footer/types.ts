import type { LucideIcon } from "lucide-react";

export type FooterLink = {
  label: string;
  to: string;
};

export type FooterLinksByGroup = Record<string, FooterLink[]>;

export type FooterContactItem = {
  icon: LucideIcon;
  content: string;
  href?: string;
};

export type FooterSocialLink = {
  icon: LucideIcon;
  href: string;
  label: string;
};
