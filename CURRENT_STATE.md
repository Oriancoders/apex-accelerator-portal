# Current Project State Summary

## What You Have
This is an on-demand Salesforce consulting platform (Netinshell) with:
- ✅ Ticket system (create, list, detail, update)
- ✅ Proposal workflow (admin creates proposal, client approves)
- ✅ Multi-tenant company structure (agents, companies, team members)
- ✅ Role-based access (admin, company_admin, agent, member)
- ✅ Credit system (users buy credits to pay for ticket work)
- ✅ Supabase backend with RLS policies
- ✅ React + Vite frontend with TypeScript + Shadcn UI
- ✅ Edge Functions backend at `supabase/functions/`

## Current Database State
- ❌ `sandbox_connections` table does NOT exist (rollback occurred on 20260319)
- ❌ `sandbox_audit_log` table does NOT exist (rollback occurred on 20260319)
- ❌ `tickets.category` column does NOT exist (was in sandbox integration, rolled back)
- ✅ All other tables exist as documented in RECON_MIGRATIONS.md

**Timeline:**
- 2026-03-19 12:10: Sandbox integration migration applied (20260319121000)
- 2026-03-19 12:45: Sandbox integration rolled back (20260319124500)
- Result: Tables and category column removed from DB

## Code That Exists But Isn't Wired
The existing code includes:
- ✅ `src/components/sandbox/SandboxConnect.tsx` (component exists)
- ✅ `src/components/sandbox/SandboxDashboard.tsx` (component exists)
- ✅ `src/components/sandbox/SandboxCallback.tsx` (component exists)
- ✅ `/oauth/callback` route registered in routes (line 58 of routes/index.tsx)
- ✅ SandboxConnect/Dashboard imports in TicketDetailPage.tsx (lines 17-18)
- ✅ Sandbox connection check logic in TicketDetailPage useEffect (lines 86-100+)

**But:** The database tables these components expect don't exist, so the integration is incomplete.

## What's Needed
To complete the Salesforce Sandbox OAuth2 integration:

1. **Run the migration again** — Apply 20260319121000_sandbox_integration.sql to recreate:
   - `sandbox_connections` table (with all columns and constraints)
   - `sandbox_audit_log` table (with all columns and constraints)
   - `tickets.category` column with check constraint
   - RLS policies for both tables
   - Triggers for URL validation and timestamp updates
   - Functions for validation logic

2. **Verify/Complete Backend Endpoints** (if not already done):
   - `POST /api/sf/exchange-token` — Exchange OAuth code for tokens (backend only)
   - `GET /api/sf/objects` — Fetch Salesforce objects list

3. **Verify Frontend Components** — Check that:
   - `src/lib/salesforce-oauth.js` exists with helper functions
   - Components reference correct env vars
   - OAuth flow matches BLUEPRINT.md spec

4. **Environment Variables** — Ensure these are set:
   - Frontend: `VITE_SF_CLIENT_ID`, `VITE_SF_REDIRECT_URI`
   - Backend: `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_REDIRECT_URI`

5. **Salesforce Setup** (one-time, already done):
   - Connected App created in Salesforce dev org
   - Consumer Key → `SF_CLIENT_ID`
   - Consumer Secret → `SF_CLIENT_SECRET`
   - Callback URL registered: `http://localhost:5173/oauth/callback`

## Key File Locations
- **Routes:** `src/routes/index.tsx` (oauth/callback already registered)
- **TicketDetail:** `src/pages/TicketDetailPage.tsx` (sandbox logic already integrated)
- **Components:** `src/components/sandbox/` (all 3 components exist)
- **Supabase Client:** `src/integrations/supabase/client.ts`
- **Auth Context:** `src/contexts/AuthContext.tsx`
- **Migrations:** `supabase/migrations/` (sandbox integration exists but rolled back)

## Database Schema Facts
**tickets table:**
- Status values: `['submitted', 'under_review', 'approved', 'in_progress', 'completed', 'cancelled', 'uat', 'closed']`
- When proposal approved: status = `'approved'` (need to verify if category = salesforce also triggers something)
- NEW (if migration runs): `category` column with values `['general', 'salesforce']`

**User Roles (app-level):**
- Stored in `public.user_roles` table
- Values: `['admin', 'company_admin', 'agent', 'member']`
- One role per user (unique constraint enforced)

**Key RLS Helpers:**
- `has_role(user_id, role_name)` — Check app-level role
- `is_company_assigned_agent(user_id, company_id)` — Check if assigned to company
- `is_company_member(user_id, company_id)` — Check tenant membership

## Next Steps (Based on BLUEPRINT.md + Current State)
1. Determine WHY the sandbox integration was rolled back (check git history/comments)
2. If rolling back was a mistake: Re-apply migration 20260319121000_sandbox_integration.sql
3. If rolling back was intentional: Clarify what changed in the requirements
4. Once DB is ready: Verify components and backend endpoints work end-to-end
5. Test OAuth flow with actual Salesforce sandbox

## Files With Sandbox Code Already
- `src/pages/TicketDetailPage.tsx:17-18` — SandboxConnect/Dashboard imports
- `src/pages/TicketDetailPage.tsx:47` — hasActiveConnection state
- `src/pages/TicketDetailPage.tsx:86-100+` — Connection check useEffect
- `src/routes/index.tsx:12,58` — SandboxCallback import and route
- `src/components/sandbox/` — All 3 components (exist, need DB)
