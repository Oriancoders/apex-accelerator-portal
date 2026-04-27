import { Timer, Rocket, ShieldCheck } from "lucide-react";
import type { Principle } from "./types";

export const PRINCIPLES: Principle[] = [
  {
    icon: Timer,
    title: "Pay As You Go",
    text: "No retainers and no monthly commitment. You only pay when work is approved and delivered.",
  },
  {
    icon: Rocket,
    title: "Fast Execution",
    text: "Create a ticket, review the proposal, approve it, and track progress in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Clear Process",
    text: "Transparent ticket stages, clear ownership, and communication history across the task lifecycle.",
  },
];

export const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  company: "",
  message: "",
};

export const SUPPORT_EMAIL = "support@customerconnect.com";
export const SUPPORT_PHONE = "+1 (555) 123-4567";
