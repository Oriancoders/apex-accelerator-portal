import {
  Coins,
  Handshake,
  LayoutDashboard,
  MessageSquare,
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
    label: "Client Requests",
    items: [
      { title: "Tickets", url: "/admin/tickets", icon: Ticket },
      { title: "Contacts", url: "/admin/contacts", icon: MessageSquare },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Consultants", url: "/admin/consultants", icon: Handshake },
      { title: "Agents", url: "/admin/agents", icon: UserCog },
      { title: "Company Access", url: "/admin/company-members", icon: UsersRound },
      { title: "Credits", url: "/admin/credits", icon: Coins },
    ],
  },
];

export const adminAccordionDefaultOpen = adminNavGroups.map((group) => group.label);

export const allAdminItems = adminNavGroups.flatMap((group) => group.items);
