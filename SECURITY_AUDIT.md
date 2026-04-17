# Security Audit Report

## Results
| Check | Status | Notes |
|-------|--------|-------|
| Production URL - frontend | PASS | `src/lib/salesforce-oauth.ts` uses `test.salesforce.com` authorize endpoint and calls `isProductionOrg()` guard before redirect creation. |
| Production URL - callback | PASS | `src/components/sandbox/SandboxCallback.tsx` blocks if `isProductionOrg(tokenPayload.instance_url)` is true. |
| Production URL - database | PASS | `supabase/migrations/20260319121000_sandbox_integration.sql` defines `check_sandbox_url` and trigger `enforce_sandbox_only`. |
| CSRF state generated | PASS | `buildOAuthURL()` stores generated state in `sessionStorage`. |
| CSRF state verified | PASS | `SandboxCallback` calls `verifyState(returnedState)` before storing any connection. |
| Client secret not in frontend | PASS | Search across `src/` found zero `SF_CLIENT_SECRET` matches. |
| Token never exposed in frontend | PASS | Callback does not render or log token values; errors shown are sanitized user messages. |
| RLS policies present | PASS | Migration includes RLS enable + policies for `sandbox_connections` and `sandbox_audit_log`. |
| Audit log on connect | PASS | Callback inserts `action_type: oauth_connected` into `sandbox_audit_log`. |
| Revocation works | PASS | `SandboxConnect` updates `is_active = false` and logs `oauth_revoked`. |

## Issues Found & Fixed
- Added explicit frontend guard call in `buildOAuthURL()` so sandbox-only check is enforced before redirect.
- Added database-level sandbox URL trigger and RLS policies for both new tables.

## Sign-off
All 10 security checks passed.
