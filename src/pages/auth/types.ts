import { LucideIcon } from "lucide-react";

export type AuthRateLimitKind = "signin" | "reset";

export interface AuthRateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockMs: number;
}

export interface AuthRateLimitState {
  attempts: number[];
  blockedUntil?: number;
}

export type AuthView = "signin" | "forgot";

export interface FlowStep {
  icon: LucideIcon;
  label: string;
  detail: string;
  color: string;
  border: string;
  bg: string;
}
