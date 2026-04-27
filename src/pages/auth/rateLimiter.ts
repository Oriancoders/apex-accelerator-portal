import { AUTH_RATE_LIMIT_CONFIG, AUTH_RATE_LIMIT_STORAGE_KEY } from "./constants";
import type { AuthRateLimitKind, AuthRateLimitState } from "./types";

export function emptyRateLimits(): Record<AuthRateLimitKind, AuthRateLimitState> {
  return {
    signin: { attempts: [] },
    reset: { attempts: [] },
  };
}

export function readAuthRateLimits(): Record<AuthRateLimitKind, AuthRateLimitState> {
  if (typeof window === "undefined") return emptyRateLimits();

  try {
    const raw = window.localStorage.getItem(AUTH_RATE_LIMIT_STORAGE_KEY);
    if (!raw) return emptyRateLimits();

    const parsed = JSON.parse(raw) as Partial<Record<AuthRateLimitKind, AuthRateLimitState>>;
    return {
      signin: { attempts: parsed.signin?.attempts ?? [], blockedUntil: parsed.signin?.blockedUntil },
      reset: { attempts: parsed.reset?.attempts ?? [], blockedUntil: parsed.reset?.blockedUntil },
    };
  } catch {
    return emptyRateLimits();
  }
}

export function writeAuthRateLimits(next: Record<AuthRateLimitKind, AuthRateLimitState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_RATE_LIMIT_STORAGE_KEY, JSON.stringify(next));
}

export function getRateLimitStatus(kind: AuthRateLimitKind): { blocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const all = readAuthRateLimits();
  const config = AUTH_RATE_LIMIT_CONFIG[kind];
  const current = all[kind] ?? { attempts: [] };
  const attempts = (current.attempts ?? []).filter((ts) => now - ts <= config.windowMs);

  all[kind] = {
    attempts,
    blockedUntil: current.blockedUntil,
  };
  writeAuthRateLimits(all);

  if ((current.blockedUntil ?? 0) > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(((current.blockedUntil ?? 0) - now) / 1000),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export function recordAuthFailure(kind: AuthRateLimitKind): { blocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const all = readAuthRateLimits();
  const config = AUTH_RATE_LIMIT_CONFIG[kind];
  const current = all[kind] ?? { attempts: [] };
  const attempts = (current.attempts ?? []).filter((ts) => now - ts <= config.windowMs);
  attempts.push(now);

  let blockedUntil = current.blockedUntil;
  if (attempts.length >= config.maxAttempts) {
    blockedUntil = now + config.lockMs;
  }

  all[kind] = { attempts, blockedUntil };
  writeAuthRateLimits(all);

  if ((blockedUntil ?? 0) > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(((blockedUntil ?? 0) - now) / 1000),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export function clearAuthRateLimit(kind: AuthRateLimitKind) {
  const all = readAuthRateLimits();
  all[kind] = { attempts: [], blockedUntil: undefined };
  writeAuthRateLimits(all);
}

export function formatRetryTime(totalSeconds: number) {
  if (totalSeconds <= 60) return `${totalSeconds}s`;
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes}m`;
}
