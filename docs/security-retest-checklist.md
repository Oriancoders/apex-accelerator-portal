# Security Retest Checklist - Privilege Escalation and Authorization

## Scope
Target:
- https://apex-accelerator-portal.vercel.app
- Supabase REST endpoint for your project

Objective:
- Prove that non-admin users cannot escalate role to admin.
- Prove role updates only work via admin-authorized backend path.

## Pre-Checks
1. Confirm latest migrations are applied in production:
- 20260317123000_harden_rls_and_uploads.sql
- 20260317133000_lockdown_user_roles_rls.sql

2. Confirm frontend admin role update uses RPC path:
- admin_set_user_role

3. Prepare two accounts:
- Account A: normal user (member)
- Account B: real admin

4. Collect tokens:
- USER_JWT for Account A
- ADMIN_JWT for Account B

5. Set environment variables (example names):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- USER_ID_A
- USER_ID_B

6. Apply Supabase Auth dashboard limits before retest:
- See docs/supabase-auth-rate-limit-recommendations.md

## Test Case 1 - Non-admin role escalation must fail
Risk covered:
- BOLA privilege escalation via direct table patch

Request:

curl -i -X PATCH "$SUPABASE_URL/rest/v1/user_roles?user_id=eq.$USER_ID_A" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"role":"admin"}'

Expected:
- HTTP is not 200/204 success.
- Response indicates authorization failure or no rows affected due to RLS.

Pass criteria:
- Account A role remains unchanged in database.

## Test Case 2 - Non-admin cannot insert role row
Risk covered:
- Unauthorized direct role creation

Request:

curl -i -X POST "$SUPABASE_URL/rest/v1/user_roles" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"user_id":"'$USER_ID_A'","role":"admin"}'

Expected:
- Denied by RLS (non-admin cannot insert role rows).

## Test Case 3 - Non-admin cannot delete own role row
Risk covered:
- Unauthorized role removal to manipulate access behavior

Request:

curl -i -X DELETE "$SUPABASE_URL/rest/v1/user_roles?user_id=eq.$USER_ID_A" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT"

Expected:
- Denied by RLS (non-admin cannot delete roles).

## Test Case 4 - Admin can update role via secure RPC
Risk covered:
- Ensure legitimate admin path still works

Request:

curl -i -X POST "$SUPABASE_URL/rest/v1/rpc/admin_set_user_role" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"p_target_user_id":"'$USER_ID_A'","p_role":"member"}'

Expected:
- Success (2xx).
- Role changes to requested value.

## Test Case 5 - Non-admin RPC call must fail
Risk covered:
- RPC bypass attempt by regular user

Request:

curl -i -X POST "$SUPABASE_URL/rest/v1/rpc/admin_set_user_role" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"p_target_user_id":"'$USER_ID_A'","p_role":"admin"}'

Expected:
- Fails with unauthorized error from function guard.

## Test Case 6 - Normal user can only view own role
Risk covered:
- Role metadata overexposure

Request:

curl -i -X GET "$SUPABASE_URL/rest/v1/user_roles?select=user_id,role" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_JWT"

Expected:
- Response contains only Account A role row.
- No other users' role rows are visible.

## Test Case 7 - Admin can view all roles
Risk covered:
- Verify admin read policy remains operational

Request:

curl -i -X GET "$SUPABASE_URL/rest/v1/user_roles?select=user_id,role" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ADMIN_JWT"

Expected:
- Admin can view all role rows.

## DB Verification Queries
Run from SQL editor as project owner:

1. Check active policies on user_roles:

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'user_roles'
order by policyname;

Expected policies:
- Users can view own roles
- Admins can view all roles
- Admins can insert roles
- Admins can update roles
- Admins can delete roles

2. Confirm force RLS is enabled:

select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname = 'user_roles';

Expected:
- relrowsecurity = true
- relforcerowsecurity = true

## Evidence to Capture for Final Pentest Closure
1. Request/response pair for each test case.
2. Screenshot of policy list from pg_policies query.
3. Screenshot of force RLS flags.
4. Before/after role value for test user.
5. Confirmation that UI admin role change still works.

## Pass/Fail Summary Template
- TC1 Non-admin PATCH escalation: PASS/FAIL
- TC2 Non-admin role insert: PASS/FAIL
- TC3 Non-admin role delete: PASS/FAIL
- TC4 Admin RPC role update: PASS/FAIL
- TC5 Non-admin RPC call: PASS/FAIL
- TC6 User read own role only: PASS/FAIL
- TC7 Admin read all roles: PASS/FAIL

Overall security closure decision:
- Closed if all above are PASS.
- Re-open if any non-admin write path succeeds.
