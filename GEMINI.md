# GEMINI.md — Netinshell Sandbox Integration Module
### AI Context File for Google Gemini · React + Supabase + Salesforce OAuth2

---

## What You Are Working On

You are helping build the **Salesforce Sandbox OAuth2 Integration Module** for **Netinshell** — an on-demand consulting platform where businesses pay per ticket, not retainers.

This module sits inside an existing React + Supabase application. The ticketing system is already built and in beta. Your job is to add sandbox connectivity — when a client has a Salesforce-related ticket and approves a proposal, they can connect their Salesforce sandbox via OAuth2, allowing the consulting team to work directly inside it.

---

## Before You Write Any Code — Mandatory First Steps

### Step 1: Read the Supabase Migration Files

```
supabase/migrations/    ← read every .sql file in chronological order
```

You must extract and confirm before touching anything:

- Exact `tickets` table column name for status (could be `status`, `ticket_status`, `state`)
- Exact enum/check values for status — especially the "proposal approved" value
- Exact column name for category — and the exact value that means "salesforce"
- How user roles are stored — `user_metadata`, a `profiles` table, or a `roles` table
- All existing RLS policies — your new policies must not conflict
- Whether `sandbox_connections` or `sandbox_audit_log` already exist in any form

### Step 2: Read the Existing Project

```
src/                 ← full directory
package.json
```

Confirm:
- Where the Supabase client singleton is (`src/lib/supabase.ts`? somewhere else?)
- Where the TicketDetail component is and how it fetches data
- What router version is used and how routes are added
- What UI component library is in use (Shadcn? MUI? Custom?)
- Whether TypeScript is used
- Where the backend lives (Express? Supabase Edge Functions? Next.js API routes?)

> Do not assume anything. The answers are in the files. Read them first.

---

## Project Context

### What Already Exists (Do Not Re-build)

- User authentication
- Ticket creation by clients
- Ticket listing and detail views
- Admin/consultant ticket review
- Proposal creation, sending, and approval
- Company, agent, and member management

### What You Are Adding

Only this:

1. A "Connect Sandbox" button that appears on the ticket when `category = salesforce` AND `status = proposal_approved`
2. OAuth2 flow connecting to the client's Salesforce sandbox (never production)
3. Token storage in Supabase with RLS
4. A sandbox dashboard showing org info, SF objects, and audit log
5. Audit logging of every action your team takes inside the sandbox
6. One-click revocation by the client

---

## Ticket Status Flow

```
submitted → under_review → proposal_sent → proposal_approved → sandbox_connected → in_progress → review_pending → completed
```

The sandbox button appears between `proposal_approved` and `sandbox_connected`.

> The exact string values for each status are in your migration files. Use those — not these labels.

---

## Trigger Condition for Sandbox Button

Show `SandboxConnect` only when ALL three are true:

```js
ticket.category === '<salesforce value from migrations>'
&& ticket.status === '<proposal_approved value from migrations>'
&& !hasActiveConnection   // no row in sandbox_connections with is_active = true
```

If `hasActiveConnection` is true, show `SandboxDashboard` instead.

---

## New Database Tables

### sandbox_connections

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `ticket_id` | uuid FK | unique — one sandbox per ticket |
| `user_id` | uuid FK | the client who connected |
| `sf_org_id` | text | Salesforce org ID |
| `sf_instance_url` | text | must be a sandbox URL, never login.salesforce.com |
| `sf_org_type` | text | always `'sandbox'` |
| `access_token` | text | OAuth access token |
| `refresh_token` | text | OAuth refresh token |
| `sf_user_email` | text | connecting user's email |
| `sf_display_name` | text | connecting user's display name |
| `is_active` | boolean | false = revoked |
| `revoked_at` | timestamptz | when revoked |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | auto-updated by trigger |

### sandbox_audit_log

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `connection_id` | uuid FK | |
| `ticket_id` | uuid | denormalized |
| `action_type` | text | `oauth_connected`, `metadata_read`, `metadata_write`, `soql_query`, `deploy` |
| `action_detail` | jsonb | specifics of what was done |
| `performed_by` | text | `'ai_agent'` or consultant's user_id |
| `created_at` | timestamptz | |

---

## Files to Create

```
supabase/migrations/XXXXX_sandbox.sql
src/lib/salesforce-oauth.js (or .ts)
src/components/sandbox/SandboxConnect.jsx (or .tsx)
src/components/sandbox/SandboxCallback.jsx (or .tsx)
src/components/sandbox/SandboxDashboard.jsx (or .tsx)
```

## Files to Modify (Read Fully Before Touching)

```
src/App.jsx (or router file)    ← add /oauth/callback route
src/pages/TicketDetail.jsx      ← add conditional sandbox components
src/types/index.ts              ← add types if TypeScript
```

---

## Component Responsibilities

### SandboxConnect.jsx
- Embedded in TicketDetail, conditional on trigger condition
- On mount: check for existing active connection
- States: `idle` → `connecting` → `connected` → `revoked`
- Connect button calls `buildOAuthURL(ticket.id)` then redirects
- Revoke button sets `is_active = false`, logs to audit table

### SandboxCallback.jsx
- Mounted at `/oauth/callback`
- Handles redirect from Salesforce after user approves
- Must execute these steps in order:
  1. Extract `code` and `state` from URL
  2. Verify `state` vs `sessionStorage` (CSRF protection) — abort if mismatch
  3. Check `instance_url` is not production — abort if `isProductionOrg()` returns true
  4. POST to `/api/sf/exchange-token` (your backend) — get tokens
  5. GET SF identity from `token.id` URL
  6. Upsert to `sandbox_connections`
  7. Insert to `sandbox_audit_log` with `action_type = 'oauth_connected'`
  8. Redirect to `/tickets/:ticketId?sandbox=connected`

### SandboxDashboard.jsx
- Shows after connection is active
- Loads: connection info, SF objects from `/api/sf/objects`, audit log
- Two tabs: Objects (searchable, grouped custom vs standard) and Audit log

### salesforce-oauth.js
```js
buildOAuthURL(ticketId)         // → SF authorization URL, saves state to sessionStorage
verifyState(returnedState)      // → { ticketId } or throws on CSRF mismatch
exchangeCodeForTokens(code)     // → calls your backend /api/sf/exchange-token
fetchObjects(instanceUrl, token)// → calls SF sobjects API
revokeToken(instanceUrl, token) // → calls SF revoke endpoint
isProductionOrg(instanceUrl)    // → true if URL looks like production
```

---

## Backend Endpoints Required

These must be added to your **existing** backend. Do not create a new backend service.

### POST /api/sf/exchange-token
```
Body:    { code: string }
Returns: { access_token, refresh_token, instance_url, id, token_type }
```
- Calls `https://test.salesforce.com/services/oauth2/token` using `SF_CLIENT_SECRET`
- `SF_CLIENT_SECRET` lives on backend only — never in any frontend file

### GET /api/sf/objects?ticketId=xxx
```
Returns: { sobjects: [...] }
```
- Uses Supabase service role key to read token from DB
- Checks `is_active = true` before using token

---

## Environment Variables

### Frontend
```env
VITE_SF_CLIENT_ID=
VITE_SF_REDIRECT_URI=http://localhost:5173/oauth/callback
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend (never in frontend)
```env
SF_CLIENT_ID=
SF_CLIENT_SECRET=      ← never expose this
SF_REDIRECT_URI=
SUPABASE_SERVICE_KEY=
```

---

## Security — Non-Negotiable

Every item below must be implemented. Do not skip any.

| Requirement | Where It Lives |
|-------------|----------------|
| Production URL blocked | `isProductionOrg()` check in frontend + callback + DB trigger |
| CSRF protection | `state` param generated → stored in `sessionStorage` → verified in callback |
| Client secret on backend only | `SF_CLIENT_SECRET` never in `src/` — grep to verify |
| RLS on both tables | Migration file |
| Audit log on every action | Every SF API call logs to `sandbox_audit_log` |
| One-click revocation | Sets `is_active = false`, backend checks before every call |

### Production URL — Three Layer Block

```
Layer 1 (frontend):   buildOAuthURL() uses test.salesforce.com only
Layer 2 (callback):   isProductionOrg() check before saving token
Layer 3 (DB trigger): RAISE EXCEPTION if instance_url contains login.salesforce.com
```

---

## OAuth2 Full Flow

```
1. Ticket: category=salesforce, status=proposal_approved
2. SandboxConnect renders → client clicks "Connect"
3. Frontend builds URL → window.location.href = SF authorize URL
4. Client logs in on test.salesforce.com → approves access
5. SF redirects → /oauth/callback?code=XXX&state=YYY
6. SandboxCallback runs 8-step process (see above)
7. Token saved to Supabase → redirect back to ticket
8. SandboxDashboard loads org info + objects + audit log
9. Team works in sandbox → every action logged
10. Client reviews → approves → ticket completes → payment
```

---

## Salesforce Connected App Setup

One-time setup in your Salesforce Developer Org:

- Setup → App Manager → New Connected App
- Enable OAuth, set callback URL to match `VITE_SF_REDIRECT_URI`
- Scopes: `api`, `refresh_token`, `offline_access`
- After saving: Consumer Key → `SF_CLIENT_ID`, Consumer Secret → `SF_CLIENT_SECRET` (backend only)
- Wait 2–10 minutes before testing

---

## What Is Out of Scope

Do not touch these — they are already built:

- Ticket creation, listing, or status management
- Proposal creation or approval flow
- Payment processing
- Admin dashboard
- Agent, company, or member management
- Any non-Salesforce ticket flow
- Production Salesforce org access (hard blocked)

---

## Definition of Done

- [ ] Migration runs cleanly on local Supabase
- [ ] `SandboxConnect` renders in `TicketDetail` only under correct conditions
- [ ] Full OAuth flow works with a real Salesforce sandbox
- [ ] `SandboxDashboard` shows org info, objects, and audit log
- [ ] All 6 security requirements implemented
- [ ] `SF_CLIENT_SECRET` appears nowhere in `src/` (grep to confirm)
- [ ] Client can revoke access and team loses it immediately

---

## Common Mistakes to Avoid

- **Do not hardcode status or category values** — read them from migrations
- **Do not create a new backend service** — add endpoints to the existing one
- **Do not modify existing ticket or proposal logic** — only add to TicketDetail
- **Do not store SF_CLIENT_SECRET in any frontend file**
- **Do not accept login.salesforce.com URLs** — always block production
- **Do not duplicate the Supabase client** — use the existing singleton
- **Do not use sessionStorage for token storage** — only use it for the OAuth state param
