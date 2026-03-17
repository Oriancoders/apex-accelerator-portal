# Supabase Auth Rate Limit Recommendations

## Why this is needed
App-level protection through Edge Functions helps, but attackers can still target native Supabase Auth endpoints directly.
Configure Supabase Auth rate limits in Dashboard to close that gap.

## Recommended baseline thresholds
Use these values as a secure baseline for production. Adjust only after traffic observation.

| Flow | Recommended Limit | Window | Notes |
|---|---:|---:|---|
| Sign in (password) | 5 requests | 60 seconds | Per source IP (primary anti-bruteforce baseline). |
| Sign up | 3 requests | 15 minutes | Per source IP and per email where available. |
| Password reset (send reset email) | 3 requests | 15 minutes | Prevents reset-email abuse/spam. |
| Email OTP verify | 5 attempts | 10 minutes | Covers verify-email and magic-link OTP style checks. |
| Email OTP resend | 3 requests | 10 minutes | Prevents OTP resend flooding. |

## Recommended lock behavior
- If threshold is hit: return HTTP 429.
- Prefer short lock windows for normal limits (1 to 15 minutes).
- For repeated failed sign-ins, use a stronger lock (15 minutes) and progressively increase if abuse continues.

## Supabase dashboard path
1. Open Supabase Project Dashboard.
2. Go to Authentication.
3. Open Security / Rate limits section.
4. Set limits for sign-in, sign-up, password reset, and email OTP flows.
5. Save settings and test from a non-admin account.

## Alignment with this codebase
Current Edge Function guard in auth-guard already enforces:
- Sign in: 10 per 60 seconds
- Sign up: 5 per 300 seconds
- Reset: 4 per 300 seconds
- Failed sign-in lock: 5 failed attempts per 15 minutes

For tighter posture, either:
- Lower auth-guard thresholds to match the table above, or
- Keep current guard and set Dashboard limits equal or stricter.

## Verification checklist
- Send repeated wrong-password sign-in attempts and confirm 429 + Retry-After.
- Send repeated signup requests and confirm 429.
- Send repeated password reset requests and confirm 429.
- Trigger repeated OTP verify/resend attempts and confirm 429.
- Confirm error bodies remain generic (no user enumeration).

## Rollout note
Apply changes during low-traffic window and monitor legitimate failure rate for 24 to 48 hours.
If false positives increase, tune limits gradually instead of disabling controls.
