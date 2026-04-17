import {
  Coins,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  SlidersHorizontal,
  Ticket,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import type { AdminNavGroup } from "./types";

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Communications",
    items: [
      { title: "Tickets", url: "/admin/tickets", icon: Ticket },
      { title: "Contacts", url: "/admin/contacts", icon: MessageSquare },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Agents", url: "/admin/agents", icon: UserCog },
      { title: "Company Members", url: "/admin/company-members", icon: UsersRound },
      { title: "Credits", url: "/admin/credits", icon: Coins },
      { title: "Company Components", url: "/admin/company-components", icon: SlidersHorizontal },
    ],
  },
];

export const adminAccordionDefaultOpen = adminNavGroups.map((group) => group.label);

export const allAdminItems = adminNavGroups.flatMap((group) => group.items);
