import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export type Membership = {
  company_id: string;
  is_primary: boolean;
  role: string;
  companies: {
    name: string | null;
    slug: string | null;
  } | null;
};
