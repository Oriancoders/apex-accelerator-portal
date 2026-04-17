import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};
