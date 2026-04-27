import { UserCog, Building2, CreditCard, TicketCheck } from "lucide-react";
import type { AuthRateLimitConfig, FlowStep } from "./types";

export const AUTH_RATE_LIMIT_CONFIG: Record<"signin" | "reset", AuthRateLimitConfig> = {
  signin: { maxAttempts: 5, windowMs: 60_000, lockMs: 5 * 60_000 },
  reset: { maxAttempts: 3, windowMs: 5 * 60_000, lockMs: 10 * 60_000 },
};

export const AUTH_RATE_LIMIT_STORAGE_KEY = "auth-rate-limit-v1";

export const FLOW_STEPS: FlowStep[] = [
  {
    icon: UserCog,
    label: "Partner onboarding",
    detail: "Company access",
    color: "text-emerald-300",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Building2,
    label: "Company workspace",
    detail: "Members and roles",
    color: "text-sky-300",
    border: "border-sky-400/30",
    bg: "bg-sky-400/10",
  },
  {
    icon: CreditCard,
    label: "Subscription flow",
    detail: "Credits handled",
    color: "text-amber-300",
    border: "border-amber-400/30",
    bg: "bg-amber-400/10",
  },
  {
    icon: TicketCheck,
    label: "Ticket delivery",
    detail: "Admin assignment",
    color: "text-teal-300",
    border: "border-teal-400/30",
    bg: "bg-teal-400/10",
  },
];
