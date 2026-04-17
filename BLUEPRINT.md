# NETINSHELL — Developer Blueprint
### Sandbox Integration Module · React + Supabase · Salesforce OAuth2

---

## ⚠️ STOP — Read This Before Touching Any Code

Before writing a single line, you must do two things:

1. **Read every file in `supabase/migrations/` in order.** The entire data model is already defined there. Your work must align with it exactly. Do not assume column names, enum values, or table structures — read them.

2. **Read the existing project structure.** Understand what already exists before adding anything new.

Only after completing both steps should you proceed to the implementation sections below.

---

## Table of Contents

- [0. Read First — Migrations & Project Structure](#0-read-first)
- [1. Project Overview](#1-project-overview)
- [2. Ticket Status Flow](#2-ticket-status-flow)
- [3. Sandbox Trigger Condition](#3-sandbox-trigger-condition)
- [4. Database Schema — New Tables](#4-database-schema)
- [5. Salesforce Connected App Setup](#5-salesforce-setup)
- [6. Environment Variables](#6-environment-variables)
- [7. File Structure](#7-file-structure)
- [8. Component Logic](#8-component-logic)
- [9. Backend Endpoints Required](#9-backend-endpoints)
- [10. OAuth2 Flow — Step by Step](#10-oauth2-flow)
- [11. Security Requirements](#11-security-requirements)
- [12. Implementation Checklist](#12-implementation-checklist)
- [13. Out of Scope](#13-out-of-scope)
- [14. Questions to Answer Before Coding](#14-questions-before-coding)

---

## 0. Read First

### 0.1 Read All Supabase Migration Files

```
supabase/migrations/          ← read EVERY .sql file, in chronological order
```

Extract and note down before coding:

- Exact table names (`tickets`, `proposals`, `profiles`, etc.)
- Exact column names — do not guess (e.g. is it `status` or `ticket_status`?)
- Exact enum values for ticket status (e.g. is it `proposal_approved` or `approved`?)
- Exact enum values for ticket category (e.g. `salesforce` or `SALESFORCE` or `sf`?)
- Foreign key relationships between tables
- Existing RLS policies — your new policies must not conflict
- Any existing triggers or functions that affect ticket state
- How user roles are stored (user_metadata? a `profiles` table? a `roles` table?)

> **Do NOT create new tables or columns until you confirm they don't already exist.**

### 0.2 Read the Existing Project Structure

```
src/components/       ← what UI components already exist
src/pages/            ← existing routes and page structure
src/lib/ or src/utils/← existing Supabase client setup (find the singleton)
src/hooks/            ← existing data fetching patterns
src/types/            ← TypeScript types to extend, not duplicate
```

Find and read the existing **TicketDetail** component fully before modifying it.

---

## 1. Project Overview

Netinshell is an on-demand consulting platform. Clients pay per ticket — only when they need help. No retainers, no idle costs.

| Model | Description |
|-------|-------------|
| Traditional consulting | Client pays monthly retainer regardless of work |
| Netinshell | Client pays per ticket — only when they need help |
| Salesforce module | Work is done inside the client's sandbox, not just advice |

### What Is Already Built (Do Not Re-build)

The ticketing system is complete and in beta. The following exist and work:

- User authentication (client and admin/consultant roles)
- Ticket creation by client
- Ticket listing and detail views
- Admin ticket review
- Proposal creation and sending by admin
- Client proposal approval/rejection
- Ticket status management
- Company, agent, and company member management

### What This Blueprint Adds

This blueprint covers **only** the Salesforce Sandbox OAuth2 integration:

- A "Connect Sandbox" button that appears when admin sets ticket category to `salesforce` and client approves the proposal
- OAuth2 flow to authenticate client's Salesforce sandbox
- Token storage in Supabase (encrypted, with RLS)
- Sandbox dashboard showing org info and SF objects
- Full audit log of every action taken inside the sandbox
- One-click revocation by the client at any time

---

## 2. Ticket Status Flow

This is the full lifecycle of a ticket. The sandbox module plugs in at a specific point.

```
submitted
    ↓
under_review          ← admin opens ticket
    ↓
proposal_sent         ← admin creates proposal + sets category (e.g. salesforce)
    ↓
proposal_approved     ← client approves  ◄─── SANDBOX BUTTON APPEARS HERE
    ↓                                          (only if category = salesforce)
sandbox_connected     ← client completes OAuth2 flow
    ↓
in_progress           ← team is working in sandbox
    ↓
review_pending        ← work done, client reviews in sandbox
    ↓
completed             ← client approves → ticket closes → payment
```

> **Important:** The exact status values above may differ from your DB. Read migrations and use the exact values defined there.

---

## 3. Sandbox Trigger Condition

The "Connect Sandbox" UI element must appear **only** when ALL of the following are true:

```js
ticket.category === 'salesforce'        // exact value from your DB enum
&& ticket.status === 'proposal_approved' // exact value from your DB enum
&& !hasActiveConnection                  // no sandbox_connections row with is_active = true
```

If an active sandbox connection already exists for this ticket, show `SandboxDashboard` instead of the connect button.

The `category` field is set by the admin when creating or editing the proposal. Read your migrations to confirm the exact field name and enum values.

---

## 4. Database Schema

> **Before running any SQL:** Check your existing migrations. If `sandbox_connections` or `sandbox_audit_log` already exist in any form, extend them — do not recreate.

### 4.1 sandbox_connections

Stores OAuth2 tokens and org identity. One row per ticket (unique constraint on `ticket_id`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `ticket_id` | uuid FK → tickets | unique — one sandbox per ticket |
| `user_id` | uuid FK → auth.users | the client who connected |
| `sf_org_id` | text | Salesforce organization ID |
| `sf_instance_url` | text | e.g. `https://yourorg.sandbox.my.salesforce.com` |
| `sf_org_type` | text | always `'sandbox'` — never `'production'` |
| `access_token` | text | OAuth access token (short-lived) |
| `refresh_token` | text | OAuth refresh token (long-lived) |
| `token_expires_at` | timestamptz | when access_token expires |
| `sf_user_id` | text | Salesforce user ID of connecting user |
| `sf_user_email` | text | email of connecting Salesforce user |
| `sf_display_name` | text | display name from SF identity endpoint |
| `is_active` | boolean | default `true` — set to `false` on revoke |
| `revoked_at` | timestamptz | when client revoked access |
| `revoked_by` | uuid FK → auth.users | who revoked |
| `created_at` | timestamptz | `default now()` |
| `updated_at` | timestamptz | `default now()` — auto-updated by trigger |

### 4.2 sandbox_audit_log

Every action your team takes in the sandbox is logged here. Non-negotiable — clients need full visibility.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `connection_id` | uuid FK → sandbox_connections | |
| `ticket_id` | uuid | denormalized for easier querying |
| `action_type` | text | `oauth_connected`, `metadata_read`, `metadata_write`, `soql_query`, `deploy` |
| `action_detail` | jsonb | what exactly was done (field name, object type, etc.) |
| `performed_by` | text | `'ai_agent'` or the consultant's user_id |
| `sf_api_endpoint` | text | which Salesforce API endpoint was called |
| `created_at` | timestamptz | `default now()` |

### 4.3 RLS Policies

```sql
-- Clients see only their own connections
CREATE POLICY "client_own_connections" ON sandbox_connections
  FOR ALL USING (auth.uid() = user_id);

-- Admins see connections for tickets assigned to them
-- ⚠️ Adjust the subquery to match your actual tickets schema
CREATE POLICY "admin_assigned_connections" ON sandbox_connections
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM tickets WHERE assigned_to = auth.uid())
  );

-- Audit log mirrors connection access
CREATE POLICY "users_see_own_audit_logs" ON sandbox_audit_log
  FOR SELECT USING (
    connection_id IN (
      SELECT id FROM sandbox_connections WHERE user_id = auth.uid()
    )
  );
```

### 4.4 Safety Triggers

```sql
-- Block production org URLs at the DB level
CREATE OR REPLACE FUNCTION check_sandbox_url()
RETURNS trigger AS $$
BEGIN
  IF NEW.sf_instance_url ILIKE '%login.salesforce.com%' THEN
    RAISE EXCEPTION 'Production Salesforce orgs are not allowed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_sandbox_only
  BEFORE INSERT ON sandbox_connections
  FOR EACH ROW EXECUTE FUNCTION check_sandbox_url();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sandbox_connections_updated_at
  BEFORE UPDATE ON sandbox_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. Salesforce Setup

> One-time setup by the Netinshell team. Clients install nothing — they just authorize your Connected App.

### Create the Connected App

In **your** Salesforce Developer Org (not a client's org):

1. Setup → App Manager → New Connected App
2. App Name: `Netinshell`
3. Enable OAuth Settings: ✓
4. Callback URLs:
   ```
   https://yourapp.com/oauth/callback    ← production
   http://localhost:5173/oauth/callback  ← development
   ```
5. Selected OAuth Scopes: `api`, `refresh_token`, `offline_access`
6. Require Secret for Web Server Flow: ✓
7. Save → wait 2–10 minutes for propagation

After saving, note:
- **Consumer Key** → `SF_CLIENT_ID` (frontend + backend)
- **Consumer Secret** → `SF_CLIENT_SECRET` (**backend only — never in frontend**)

---

## 6. Environment Variables

### Frontend `.env`
```env
VITE_SF_CLIENT_ID=your_consumer_key
VITE_SF_REDIRECT_URI=http://localhost:5173/oauth/callback
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend `.env`
```env
SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret    # NEVER expose in frontend
SF_REDIRECT_URI=http://localhost:5173/oauth/callback
SUPABASE_SERVICE_KEY=your_service_role_key
```

> ⚠️ `SF_CLIENT_SECRET` must never appear in any frontend file, git commit, or browser network request.

---

## 7. File Structure

### New Files to Create

```
src/
  components/
    sandbox/
      SandboxConnect.jsx       ← connect button + OAuth trigger
      SandboxCallback.jsx      ← OAuth callback handler
      SandboxDashboard.jsx     ← org info, objects, audit log
  lib/
    salesforce-oauth.js        ← OAuth helper functions

supabase/
  migrations/
    XXXXXXXXXXXXXX_sandbox.sql ← new migration for the two tables above
```

### Existing Files to Modify

| File | What to Add |
|------|-------------|
| `src/pages/TicketDetail.jsx` (or equivalent) | Conditionally render `SandboxConnect` or `SandboxDashboard` based on trigger condition |
| `src/App.jsx` (or router file) | Add `/oauth/callback` route pointing to `SandboxCallback` |
| `src/types/index.ts` (if TypeScript) | Add `SandboxConnection` and `SandboxAuditLog` types |

> Read each existing file fully before modifying. Do not overwrite existing logic — add to it.

### Routing

```jsx
// Match the pattern of how other routes are defined in your app
<Route path="/oauth/callback" element={<SandboxCallback />} />
```

The `/oauth/callback` path must exactly match the Callback URL in the Connected App settings.

---

## 8. Component Logic

### 8.1 SandboxConnect.jsx

Embedded inside the ticket detail page. Conditional — renders only when the trigger condition is met (Section 3).

```jsx
// In TicketDetail — read the existing component first, then add this
{ticket.category === 'salesforce'
  && ticket.status === 'proposal_approved'
  && !hasActiveConnection && (
  <SandboxConnect ticket={ticket} onConnected={handleConnected} />
)}

{hasActiveConnection && (
  <SandboxDashboard ticketId={ticket.id} />
)}
```

Internal states:

| State | Trigger | UI |
|-------|---------|-----|
| `idle` | Default | Connect button + trust indicators (sandbox only, audit log, revoke) |
| `connecting` | Button clicked | Spinner + "Redirecting to Salesforce..." |
| `connected` | Callback success | Org info, audit log link, revoke button |
| `revoked` | Revoke clicked | Confirmation message + reconnect option |

### 8.2 SandboxCallback.jsx

Mount at `/oauth/callback`. Handles the redirect back from Salesforce.

Steps (in order — each must succeed before next):

1. Extract `code` and `state` from URL params
2. Verify `state` matches `sessionStorage` value (CSRF check) — abort if mismatch
3. Check `instance_url` does not contain `login.salesforce.com` — abort if production
4. POST to `/api/sf/exchange-token` with the `code` — backend calls Salesforce with `client_secret`
5. GET the identity URL from token response — extract `org_id`, `user_email`, `display_name`
6. Upsert into `sandbox_connections` in Supabase
7. Insert into `sandbox_audit_log` with `action_type = 'oauth_connected'`
8. Redirect to `/tickets/:ticketId?sandbox=connected`

### 8.3 SandboxDashboard.jsx

Shown after a successful connection. Displays:

- Org info header (org ID, instance URL, connected user, sandbox badge)
- Stats bar (total objects, custom objects, standard objects, audit events)
- Objects tab — searchable list of all SF objects, grouped custom vs standard
- Audit log tab — every action logged with type, detail, performer (AI/human), timestamp

### 8.4 salesforce-oauth.js

Helper functions:

```js
buildOAuthURL(ticketId)         // builds SF authorization URL with state param
verifyState(returnedState)      // CSRF check — throws if mismatch
exchangeCodeForTokens(code)     // calls your backend /api/sf/exchange-token
fetchObjects(instanceUrl, token)// calls SF sobjects API
revokeToken(instanceUrl, token) // calls SF revoke endpoint
isProductionOrg(instanceUrl)    // returns true if URL looks like production
```

---

## 9. Backend Endpoints

> The token exchange MUST happen on your backend. `SF_CLIENT_SECRET` must never be in the frontend.
> If you already have a backend (Express, Supabase Edge Functions, Next.js API routes) — add these endpoints there. Do not create a new backend service.

### POST `/api/sf/exchange-token`

```
Body:    { code: string, redirect_uri: string }
Returns: { access_token, refresh_token, instance_url, id, token_type }
```

```js
// Backend implementation (Node/Express example)
app.post('/api/sf/exchange-token', async (req, res) => {
  const { code } = req.body
  const params = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    client_id:     process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,  // safe on backend
    redirect_uri:  process.env.SF_REDIRECT_URI
  })
  const sfRes = await fetch('https://test.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })
  const data = await sfRes.json()
  if (data.error) return res.status(400).json(data)
  res.json(data)
})
```

### GET `/api/sf/objects?ticketId=xxx`

```
Returns: { sobjects: [...] }
```

```js
app.get('/api/sf/objects', async (req, res) => {
  const { ticketId } = req.query
  // Use service role key to read token from Supabase (bypasses RLS)
  const { data: conn } = await supabaseAdmin
    .from('sandbox_connections')
    .select('access_token, sf_instance_url')
    .eq('ticket_id', ticketId)
    .eq('is_active', true)
    .single()

  const sfRes = await fetch(
    `${conn.sf_instance_url}/services/data/v59.0/sobjects/`,
    { headers: { Authorization: `Bearer ${conn.access_token}` } }
  )
  res.json(await sfRes.json())
})
```

---

## 10. OAuth2 Flow — Step by Step

```
1. Client has a Salesforce ticket (category = salesforce, status = proposal_approved)
        ↓
2. SandboxConnect renders inside the ticket detail page
        ↓
3. Client clicks "Connect Sandbox via OAuth"
        ↓
4. Frontend builds OAuth URL:
   https://test.salesforce.com/services/oauth2/authorize
   ?response_type=code
   &client_id=YOUR_CONSUMER_KEY
   &redirect_uri=https://yourapp.com/oauth/callback
   &scope=api refresh_token
   &state=BASE64_ENCODED_JSON({ ticketId, nonce })
        ↓
5. State is saved to sessionStorage before redirect
        ↓
6. Browser redirects to test.salesforce.com/login
        ↓
7. Client logs in to their sandbox and approves access
        ↓
8. Salesforce redirects to https://yourapp.com/oauth/callback?code=XXX&state=YYY
        ↓
9. SandboxCallback:
   - Verifies state (CSRF check)
   - Checks instance_url is not production
   - Calls backend /api/sf/exchange-token
   - Fetches SF identity
   - Saves to sandbox_connections
   - Logs to sandbox_audit_log
        ↓
10. Redirect to /tickets/:ticketId?sandbox=connected
        ↓
11. TicketDetail detects active connection → renders SandboxDashboard
        ↓
12. Team (AI agent or human consultant) works in sandbox via stored token
        ↓
13. Every SF API call logged to sandbox_audit_log
        ↓
14. Client reviews work in sandbox → approves → ticket completed → payment
```

---

## 11. Security Requirements

All items below are non-negotiable.

| Requirement | Implementation |
|-------------|----------------|
| Sandbox-only enforcement | Block any `instance_url` not containing sandbox/test. DB trigger + frontend check + backend check. Three layers. |
| CSRF protection | Generate random `state` before OAuth redirect. Store in `sessionStorage`. Verify on callback. Abort if mismatch. |
| Client secret protection | `SF_CLIENT_SECRET` only on backend. Never in frontend bundle, never in git, never in browser network tab. |
| Token encryption | Supabase encrypts at rest. Use service role key only on backend for token reads. Frontend never touches raw tokens. |
| Row Level Security | Clients see only their own connections. Consultants see only connections for their assigned tickets. |
| Consultant isolation | Consultants get a scoped API session via your backend. They never see raw OAuth tokens. |
| Audit logging | Every SF API call made by your platform — AI agent or human — is logged to `sandbox_audit_log`. |
| One-click revocation | Client sets `is_active = false`. Backend checks this before every API call. If false, returns 403. |
| Token auto-expiry | Cron job or Supabase scheduled function to revoke tokens when ticket status changes to `completed` or `cancelled`. |

### Production URL Check — Three Layers

```
Layer 1 (frontend):  Before OAuth redirect, validate URL uses test.salesforce.com
Layer 2 (callback):  Check instance_url in token response before saving to DB
Layer 3 (database):  DB trigger rejects INSERT if instance_url contains login.salesforce.com
```

### What Consultants Can and Cannot Do

| | |
|--|--|
| ✅ CAN | Read org metadata and schema |
| ✅ CAN | Create/modify fields, flows, validation rules in sandbox |
| ✅ CAN | Run SOQL queries against sandbox data |
| ✅ CAN | Deploy metadata changes within sandbox |
| ❌ CANNOT | Access production org |
| ❌ CANNOT | See raw OAuth tokens |
| ❌ CANNOT | Work after client revokes access |
| ❌ CANNOT | Perform any action without it being logged |

---

## 12. Implementation Checklist

Complete in this exact order.

### Phase 0 — Read First (mandatory before anything else)

- [ ] Read ALL files in `supabase/migrations/` in chronological order
- [ ] Note exact `tickets` table columns: status field name, category field name
- [ ] Note exact status enum value for "client approved proposal"
- [ ] Note exact category enum value for "salesforce"
- [ ] Note how user roles are determined in the existing system
- [ ] Read the existing TicketDetail component fully
- [ ] Find the existing Supabase client singleton and its import path
- [ ] Find the existing router file and understand the routing pattern
- [ ] Find the existing backend (Express? Edge Functions? API routes?)

### Phase 1 — Database

- [ ] Write migration: `sandbox_connections` table
- [ ] Write migration: `sandbox_audit_log` table
- [ ] Add RLS policies (match your existing auth pattern)
- [ ] Add DB trigger: block production URLs
- [ ] Add DB trigger: auto-update `updated_at`
- [ ] Test migration on local Supabase

### Phase 2 — Salesforce Setup

- [ ] Create Connected App in developer org
- [ ] Set callback URLs (dev + prod)
- [ ] Set OAuth scopes: `api`, `refresh_token`
- [ ] Copy Consumer Key and Consumer Secret to env files

### Phase 3 — Backend Endpoints

- [ ] Add `POST /api/sf/exchange-token` to existing backend
- [ ] Add `GET /api/sf/objects` to existing backend
- [ ] Test both endpoints independently before wiring to frontend

### Phase 4 — Frontend

- [ ] Create `src/lib/salesforce-oauth.js`
- [ ] Create `src/components/sandbox/SandboxConnect.jsx`
- [ ] Create `src/components/sandbox/SandboxCallback.jsx`
- [ ] Create `src/components/sandbox/SandboxDashboard.jsx`
- [ ] Add `/oauth/callback` route to existing router
- [ ] Modify TicketDetail — add conditional render of SandboxConnect / SandboxDashboard

### Phase 5 — Testing

- [ ] End-to-end OAuth flow with a real Salesforce sandbox
- [ ] State CSRF check — tamper with state, confirm rejection
- [ ] Production URL block — attempt `login.salesforce.com`, confirm rejection
- [ ] Dashboard loads objects correctly
- [ ] Audit log entries are created for each action
- [ ] Client revocation — confirm team loses access immediately
- [ ] Token expiry — confirm refresh token flow works

---

## 13. Out of Scope

Do not modify any of the following as part of this blueprint.

| Area | Status |
|------|--------|
| Ticket creation | Already built |
| Proposal creation and sending | Already built |
| Payment processing | Separate module |
| Admin dashboard | Existing — do not restructure |
| Agent management | Separate module |
| Company / member management | Separate module |
| Non-Salesforce tickets | This module is salesforce category only |
| Production org access | Hard blocked — never in scope |

---

## 14. Questions to Answer Before Coding

If you cannot answer all of these from reading the codebase, ask before proceeding:

1. What is the exact DB value for the `salesforce` category? (`'salesforce'`? `'SALESFORCE'`? `'sf'`?)
2. What is the exact DB value for the `proposal_approved` status?
3. What is the exact column name for ticket category? (`category`? `ticket_category`? `type`?)
4. How is the current user's role determined? (user_metadata? a `profiles` table? a `roles` table?)
5. Does a backend already exist? What framework? (Express? Supabase Edge Functions? Next.js API routes?)
6. What does the existing TicketDetail component import and how does it fetch data?
7. Is TypeScript in use? Are there existing type files to extend?
8. What UI component library is used? (Shadcn? MUI? Custom?)
9. What is the import path for the existing Supabase client?
10. Are there any existing API wrappers around Supabase calls to follow?

---

*Once all questions are answered and migrations are read — you have everything needed to implement this module correctly without breaking existing functionality.*
