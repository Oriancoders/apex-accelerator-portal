const INTERNAL_ERROR_PATTERNS = [
  /PGRST/i,
  /SQLSTATE/i,
  /schema/i,
  /relation/i,
  /column/i,
  /function/i,
  /jwt/i,
  /row-level security/i,
  /permission denied/i,
  /violates/i,
  /at character\s+\d+/i,
];

const FRIENDLY_ERROR_MAP: Array<[RegExp, string]> = [
  [
    /PGRST202|could not find the function|rpc .* not found|function .* does not exist/i,
    "The credit approval RPC is unavailable in the connected Supabase project. Please sync the database migrations and try again.",
  ],
  [/invalid login credentials/i, "Invalid email or password."],
  [/email not confirmed/i, "Please confirm your email before signing in."],
  [/already registered/i, "An account with this email already exists."],
  [/network|fetch failed|failed to fetch/i, "Network error. Please check your internet and try again."],
  [/insufficient/i, "Insufficient balance for this action."],
  [/unauthorized|not authenticated|forbidden/i, "You are not authorized to perform this action."],
  [/too many requests|rate limit/i, "Too many attempts. Please wait and try again."],
];

export function getUserFacingError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;

  const raw =
    typeof error === "string"
      ? error
      : (error as { message?: string }).message || fallback;

  for (const [pattern, message] of FRIENDLY_ERROR_MAP) {
    if (pattern.test(raw)) return message;
  }

  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw))) {
    return fallback;
  }

  if (raw.length > 180) return fallback;
  return raw;
}
