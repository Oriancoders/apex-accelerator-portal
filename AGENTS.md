# NETINSHELL — Agent Orchestration File
### Sandbox Integration Module · Parallel Agent Architecture

---

## How to Use This File

This file defines **specialized agents** that work in parallel to implement the Netinshell Sandbox Integration Module. Each agent owns a specific domain. They run concurrently where possible, hand off outputs to dependent agents, and converge into a single tested, integrated module.

**The orchestrator (you, or a lead agent) must:**
1. Spawn agents in the correct phase order
2. Ensure Phase 0 (Recon) is 100% complete before any other agent starts
3. Collect each agent's outputs and pass them to downstream dependents
4. Resolve conflicts when two agents touch the same file

---

## Agent Execution Map

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 0 — Must complete before anything else           │
│                                                         │
│  Agent 0A: Migration Recon    Agent 0B: Project Recon   │
│  (reads all SQL migrations)   (reads all src files)     │
│         ↓                              ↓                │
│         └──────────┬───────────────────┘                │
│                    ↓                                    │
│           RECON REPORT (shared context)                 │
└─────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 1 — Parallel (all start simultaneously)          │
│                                                         │
│  Agent 1A        Agent 1B        Agent 1C               │
│  DB Schema       SF OAuth Setup  Backend Endpoints      │
│  (migration SQL) (env + app)     (token exchange API)   │
└─────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 2 — Parallel (starts after Phase 1 complete)     │
│                                                         │
│  Agent 2A           Agent 2B         Agent 2C           │
│  SandboxConnect     SandboxCallback  SandboxDashboard   │
│  Component          Component        Component          │
└─────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 3 — Sequential (integration + testing)           │
│                                                         │
│  Agent 3A: Integration   →   Agent 3B: Security Audit   │
│  (wire all pieces)           (verify all 9 requirements)│
└─────────────────────────────────────────────────────────┘
```

---

## PHASE 0 — Reconnaissance (Blocking)

> ⚠️ No other agent may start until both Phase 0 agents complete and produce their reports.

---

### Agent 0A — Migration Recon

**Role:** Read every Supabase migration file and produce a definitive data model report. This is the single source of truth for all other agents.

**Skill to load:** None — pure reading and analysis.

**Inputs:**
```
supabase/migrations/*.sql   (all files, in chronological order)
```

**Task:**
Read every migration file completely. Extract and document:

1. Every table name that exists
2. For the `tickets` table:
   - Exact column name for status (e.g. `status`, `ticket_status`, `state`)
   - Exact enum/check values for status — list every possible value
   - Exact column name for category (e.g. `category`, `type`, `ticket_type`)
   - Exact enum/check values for category — list every possible value
   - Which value means "proposal approved by client"
   - Which value means "salesforce" category
   - Foreign key columns and what they reference
3. For the `profiles` or user-related tables:
   - How roles are stored (column name, enum values)
   - How to identify an admin vs client vs consultant
4. All existing RLS policies — list every policy on every table
5. All existing triggers and functions — list name and what they do
6. Whether `sandbox_connections` or `sandbox_audit_log` already exist in any form
7. The Supabase auth pattern used (email/password? magic link? OAuth?)

**Output:** Produce `RECON_MIGRATIONS.md` with this exact structure:

```markdown
# Migration Recon Report

## Tables Found
- table_name_1
- table_name_2
...

## tickets table
- Status column: `exact_column_name`
- Status values: ['value1', 'value2', ...]
- Proposal-approved value: `exact_value`
- Category column: `exact_column_name`
- Category values: ['value1', 'value2', ...]
- Salesforce category value: `exact_value`
- Assigned-to column: `exact_column_name`

## Users / Roles
- Role storage: [user_metadata / profiles table / roles table]
- Role column: `exact_column_name`
- Admin role value: `exact_value`
- Client role value: `exact_value`
- Consultant role value: `exact_value`

## Existing RLS Policies
[list every policy]

## Existing Triggers & Functions
[list every trigger and function]

## sandbox_connections exists: YES / NO
## sandbox_audit_log exists: YES / NO

## Auth Pattern
[describe how authentication works]
```

**Hand-off:** Pass `RECON_MIGRATIONS.md` to ALL Phase 1 and Phase 2 agents.

---

### Agent 0B — Project Structure Recon

**Role:** Read the full React project and produce a code map. Prevents agents from duplicating existing patterns or breaking existing logic.

**Skill to load:** None — pure reading and analysis.

**Inputs:**
```
src/                        (full directory tree)
package.json
vite.config.ts / .js
```

**Task:**
Read the project and document:

1. **Router file** — exact file path, routing pattern used (v5 vs v6, file-based vs config)
2. **Supabase client** — exact file path of the singleton, how it's imported (e.g. `import { supabase } from '@/lib/supabase'`)
3. **TicketDetail component** — exact file path, how it fetches data (useEffect + supabase? react-query? SWR?), prop names, how `ticket` object is shaped
4. **UI component library** — what's installed (Shadcn? MUI? Radix? custom?)
5. **TypeScript** — is it used? Where are types defined?
6. **Backend** — does one exist? (Express server? Supabase Edge Functions? Next.js API routes?) Exact location.
7. **Auth** — how is the current user accessed? (`supabase.auth.getUser()`? a context? a hook like `useUser()`?)
8. **Existing patterns** — show one example of: how a component fetches data from Supabase, how a route is added, how a component is imported into a page
9. **Naming conventions** — camelCase? PascalCase for files? `.tsx` or `.jsx`?
10. **Import aliases** — e.g. `@/` maps to `src/`?

**Output:** Produce `RECON_PROJECT.md` with this exact structure:

```markdown
# Project Recon Report

## Router
- File: `src/App.tsx` (or wherever)
- Pattern: react-router-dom v6 / v5 / other
- How to add a route: [show example from codebase]

## Supabase Client
- File: `src/lib/supabase.ts`
- Import: `import { supabase } from '@/lib/supabase'`

## TicketDetail Component
- File: `src/pages/TicketDetail.tsx`
- Data fetching: [useEffect / react-query / SWR]
- Ticket object shape: { id, status, category, ... }
- How ticket is passed in: [prop / route param / context]

## UI Library
- Library: [Shadcn / MUI / custom]
- Button import example: `import { Button } from '...'`

## TypeScript
- In use: YES / NO
- Types file: `src/types/index.ts`

## Backend
- Type: [Express / Edge Functions / Next.js API / none]
- Location: `server/` or `supabase/functions/` or `pages/api/`

## Auth
- How to get current user: [show exact pattern from codebase]

## Naming Conventions
- Files: [PascalCase.tsx / kebab-case.tsx]
- Imports: [alias @/ / relative]

## Example: Adding a New Component to TicketDetail
[show real code from the codebase]
```

**Hand-off:** Pass `RECON_PROJECT.md` to ALL Phase 1 and Phase 2 agents.

---

## PHASE 1 — Foundation (Parallel)

> All three Phase 1 agents start simultaneously after Phase 0 completes.
> Each agent receives both `RECON_MIGRATIONS.md` and `RECON_PROJECT.md`.

---

### Agent 1A — Database Schema

**Role:** Write the Supabase migration file for the two new tables.

**Skill to load:** None — SQL only.

**Inputs:**
- `RECON_MIGRATIONS.md` — check if tables already exist, match FK references exactly
- `RECON_PROJECT.md` — confirm Supabase project setup

**Task:**
Write `supabase/migrations/XXXXXXXXXXXXXX_sandbox_integration.sql` (use current timestamp for XX).

The migration must:

1. Check `RECON_MIGRATIONS.md` — if `sandbox_connections` already exists, `ALTER` it, do not `CREATE`
2. Use the **exact column names and enum values** found in `RECON_MIGRATIONS.md` for all FK references
3. Include both tables: `sandbox_connections` and `sandbox_audit_log` (see `BLUEPRINT.md` Section 4 for full column specs)
4. Include RLS policies using the **exact role values** from `RECON_MIGRATIONS.md`
5. Include both triggers: `check_sandbox_url` and `update_updated_at`
6. Wrap everything in a transaction: `BEGIN; ... COMMIT;`
7. Add `IF NOT EXISTS` guards on all `CREATE` statements

**Critical checks before writing:**
- What is the FK target for `ticket_id`? Use the exact table name from recon.
- What is the FK target for `user_id`? (`auth.users` or a `profiles` table?)
- Does the admin RLS policy use `assigned_to` or a different column name?

**Output:** One `.sql` migration file, ready to run.

**Hand-off:** Path of migration file → Agent 3A (Integration).

---

### Agent 1B — Salesforce App Config

**Role:** Set up all Salesforce Connected App configuration and environment variable documentation.

**Skill to load:** None.

**Inputs:**
- `RECON_PROJECT.md` — confirm how env vars are loaded (Vite? Next.js? CRA?)

**Task:**

1. Create `.env.example` with all required variables:
```env
# Salesforce OAuth2
VITE_SF_CLIENT_ID=
VITE_SF_REDIRECT_URI=http://localhost:5173/oauth/callback

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Backend only — never in frontend
SF_CLIENT_ID=
SF_CLIENT_SECRET=
SF_REDIRECT_URI=http://localhost:5173/oauth/callback
SUPABASE_SERVICE_KEY=
```

2. Create `docs/salesforce-setup.md` — step-by-step Connected App setup guide (screenshots not needed, just clear steps). Include:
   - Where to find App Manager in Salesforce
   - Exact scopes to select: `api`, `refresh_token`, `offline_access`
   - That callback URL must exactly match `VITE_SF_REDIRECT_URI`
   - Where to find Consumer Key and Consumer Secret after saving
   - Note: wait 2–10 minutes for propagation before testing

3. Create `src/lib/salesforce-oauth.js` (or `.ts` if TypeScript) — full OAuth helper:
   - `buildOAuthURL(ticketId)` — builds URL to `test.salesforce.com`, embeds state with ticketId + nonce, saves state to sessionStorage
   - `verifyState(returnedState)` — CSRF check, throws on mismatch, returns decoded `{ ticketId }`
   - `exchangeCodeForTokens(code)` — calls `/api/sf/exchange-token` on your backend
   - `fetchObjects(instanceUrl, accessToken)` — calls SF sobjects API
   - `revokeToken(instanceUrl, accessToken)` — calls SF revoke endpoint
   - `isProductionOrg(instanceUrl)` — returns true if URL looks like production (block it)

**Output:** Three files: `.env.example`, `docs/salesforce-setup.md`, `src/lib/salesforce-oauth.js`

**Hand-off:** `salesforce-oauth.js` path → Agents 2A and 2B.

---

### Agent 1C — Backend Endpoints

**Role:** Add the two required backend endpoints to the existing backend.

**Skill to load:** None.

**Inputs:**
- `RECON_PROJECT.md` — **critical**: must know the backend type (Express / Edge Functions / Next.js API) before writing anything
- `RECON_MIGRATIONS.md` — confirm `sandbox_connections` table name and column names

**Task:**
Based on the backend type found in `RECON_PROJECT.md`, add to the **existing backend** (not a new one):

**Endpoint 1: `POST /api/sf/exchange-token`**
```
Body:    { code: string }
Returns: { access_token, refresh_token, instance_url, id, token_type }
```
- Calls `https://test.salesforce.com/services/oauth2/token` with `client_secret`
- Returns error clearly if SF rejects the code
- Checks that returned `instance_url` is not production before returning

**Endpoint 2: `GET /api/sf/objects?ticketId=xxx`**
```
Returns: { sobjects: [...] }
```
- Uses Supabase **service role key** to read token (bypasses RLS — safe only on backend)
- Checks `is_active = true` before using token
- If token expired, attempt refresh before returning 401
- Calls `https://{instance_url}/services/data/v59.0/sobjects/`

**Both endpoints must:**
- Validate the requesting user is authenticated (check Supabase session/JWT)
- Return meaningful error messages (not just 500)
- Log errors server-side

**Output:** Code added to the existing backend file(s). List which files were modified.

**Hand-off:** Endpoint paths → Agents 2B and 2C.

---

## PHASE 2 — Components (Parallel)

> All three Phase 2 agents start simultaneously after ALL Phase 1 agents complete.
> Each agent receives `RECON_MIGRATIONS.md`, `RECON_PROJECT.md`, and the outputs of Phase 1 agents.

---

### Agent 2A — SandboxConnect Component

**Role:** Build the connect button component that triggers the OAuth flow.

**Skill to load:** `frontend-design` skill at `/mnt/skills/public/frontend-design/SKILL.md`

> Read the frontend-design skill before writing any UI code. Follow its aesthetic guidelines for production-grade quality.

**Inputs:**
- `RECON_PROJECT.md` — UI library, TypeScript, import patterns, naming conventions
- `RECON_MIGRATIONS.md` — exact status and category values for the trigger condition
- `src/lib/salesforce-oauth.js` from Agent 1B

**Task:**
Create `src/components/sandbox/SandboxConnect.jsx` (or `.tsx`).

Component requirements:

1. **Props:** `{ ticket, onConnected }` — read `RECON_PROJECT.md` to see how ticket object is shaped
2. **On mount:** Query `sandbox_connections` for an active connection on this ticket. If found, call `onConnected(connection)` immediately.
3. **Trigger condition check** — use exact values from `RECON_MIGRATIONS.md`:
   ```js
   ticket.category === '[salesforce value from recon]'
   && ticket.status === '[proposal_approved value from recon]'
   ```
4. **States:** `idle` → `connecting` → `connected` → `revoked` (see BLUEPRINT.md Section 8.1)
5. **Connect button:** calls `buildOAuthURL(ticket.id)` then `window.location.href = url`
6. **Connected state:** shows org info from the `sandbox_connections` row
7. **Revoke button:** sets `is_active = false` in Supabase, logs to `sandbox_audit_log`
8. **Trust indicators:** show "Sandbox only", "Full audit log", "One-click revoke" in idle state
9. **Match existing UI library** — if Shadcn is used, use Shadcn components. If custom, follow existing patterns.

**Output:** `src/components/sandbox/SandboxConnect.jsx`

**Hand-off:** Component path → Agent 3A (Integration).

---

### Agent 2B — SandboxCallback Component

**Role:** Build the OAuth callback handler. This is the most security-critical component.

**Skill to load:** None — logic-heavy, no UI.

**Inputs:**
- `RECON_PROJECT.md` — router pattern, Supabase client import, auth pattern
- `RECON_MIGRATIONS.md` — exact table/column names for insert
- `src/lib/salesforce-oauth.js` from Agent 1B
- Backend endpoint paths from Agent 1C

**Task:**
Create `src/components/sandbox/SandboxCallback.jsx` (or `.tsx`).

**Must implement the exact 8-step flow from BLUEPRINT.md Section 8.2:**

```
Step 1: Extract code + state from URL params
Step 2: Verify state vs sessionStorage (CSRF) — abort on mismatch
Step 3: Check instance_url not production — abort if isProductionOrg() returns true
Step 4: Call POST /api/sf/exchange-token — get tokens
Step 5: Fetch SF identity from token.id URL
Step 6: Upsert to sandbox_connections in Supabase
Step 7: Insert to sandbox_audit_log with action_type = 'oauth_connected'
Step 8: Navigate to /tickets/:ticketId?sandbox=connected
```

**Error states** — every step can fail. Each failure must:
- Set a clear user-facing error message
- NOT expose token values or internal errors to the UI
- Log the full error server-side (console.error is fine for now)

**Loading UI:** Show step progress as each step completes (Step 1 of 8... Step 2 of 8...).

**Output:** `src/components/sandbox/SandboxCallback.jsx`

**Hand-off:** Component path → Agent 3A (Integration).

---

### Agent 2C — SandboxDashboard Component

**Role:** Build the post-connection dashboard showing org info, objects, and audit log.

**Skill to load:** `frontend-design` skill at `/mnt/skills/public/frontend-design/SKILL.md`

> Read the frontend-design skill before writing any UI code. Follow its aesthetic guidelines.

**Inputs:**
- `RECON_PROJECT.md` — UI library, TypeScript, Supabase client import
- `RECON_MIGRATIONS.md` — exact column names for `sandbox_connections` and `sandbox_audit_log`
- Backend endpoint from Agent 1C (`GET /api/sf/objects`)

**Task:**
Create `src/components/sandbox/SandboxDashboard.jsx` (or `.tsx`).

Component requirements:

1. **Props:** `{ ticketId }`
2. **On mount:** Load connection from `sandbox_connections`, fetch objects from `/api/sf/objects`, load audit log from `sandbox_audit_log`
3. **Org header:** org ID, instance URL (as clickable link), connected user email, sandbox badge
4. **Stats bar:** total objects count, custom objects count, standard objects count, audit events count
5. **Objects tab:**
   - Search input filtering by name and label
   - Two groups: "Custom objects" (collapsed by default) and "Standard objects"
   - Each row shows: API name, label, queryable/updateable/createable flags
6. **Audit log tab:**
   - List all events from `sandbox_audit_log` for this ticket
   - Each row: icon by action_type, action name, detail (JSON), performer (AI/human), timestamp
   - Most recent first
7. **Empty/loading/error states** for every data fetch

**Output:** `src/components/sandbox/SandboxDashboard.jsx`

**Hand-off:** Component path → Agent 3A (Integration).

---

## PHASE 3 — Integration & Security (Sequential)

> Phase 3 is sequential. Agent 3A runs first, then 3B after 3A completes.

---

### Agent 3A — Integration

**Role:** Wire all components into the existing app. This agent modifies existing files — extreme care required.

**Skill to load:** None.

**Inputs:** Outputs from ALL previous agents:
- `RECON_PROJECT.md` — exact file paths, routing pattern, TicketDetail structure
- `RECON_MIGRATIONS.md` — trigger condition values
- All component files from Phase 2
- Migration file from Agent 1A

**Task:**

**Step 1: Add route**
Open the router file identified in `RECON_PROJECT.md`. Add ONE route:
```jsx
<Route path="/oauth/callback" element={<SandboxCallback />} />
```
Match the exact syntax pattern of existing routes. Do not refactor the router file.

**Step 2: Modify TicketDetail**
Open the TicketDetail component identified in `RECON_PROJECT.md`. Read it fully. Then add:
- Import `SandboxConnect` and `SandboxDashboard`
- Add state: `const [hasActiveConnection, setHasActiveConnection] = useState(false)`
- Add conditional render after the existing proposal/approval section:
```jsx
{ticket.category === '[value from recon]'
  && ticket.status === '[value from recon]'
  && !hasActiveConnection && (
  <SandboxConnect
    ticket={ticket}
    onConnected={() => setHasActiveConnection(true)}
  />
)}
{hasActiveConnection && (
  <SandboxDashboard ticketId={ticket.id} />
)}
```
- Add a `useEffect` on mount to check for existing connection and set `hasActiveConnection`

**Step 3: Run migration**
```bash
supabase db push
# or
supabase migration up
```
Confirm it runs without errors. If errors, fix the migration file.

**Step 4: Verify imports**
Check every import in every new component resolves correctly using the alias pattern from `RECON_PROJECT.md`.

**Output:** List of all modified files with a summary of changes made to each.

**Hand-off:** Modification summary → Agent 3B.

---

### Agent 3B — Security Audit

**Role:** Verify every security requirement from BLUEPRINT.md Section 11 is implemented correctly.

**Skill to load:** None.

**Inputs:**
- All source files produced by previous agents
- `BLUEPRINT.md` Section 11 (security requirements)

**Task:**
Run through this checklist. For each item, read the actual code and confirm it exists:

| # | Check | How to Verify |
|---|-------|--------------|
| 1 | Production URL blocked in frontend | `salesforce-oauth.js` — `isProductionOrg()` called before OAuth redirect |
| 2 | Production URL blocked in callback | `SandboxCallback` — checks `instance_url` after token exchange |
| 3 | Production URL blocked in DB | Migration file — `check_sandbox_url` trigger exists |
| 4 | CSRF state generated | `salesforce-oauth.js` — `buildOAuthURL` sets `sessionStorage` state |
| 5 | CSRF state verified | `SandboxCallback` — `verifyState()` called as step 1 |
| 6 | Client secret not in frontend | Search all `src/` files for `SF_CLIENT_SECRET` — must return 0 results |
| 7 | Token never exposed in frontend | `SandboxCallback` — no token values logged or rendered |
| 8 | RLS policies present | Migration file — policies on both tables |
| 9 | Audit log on connect | `SandboxCallback` step 7 — inserts to `sandbox_audit_log` |
| 10 | Revocation works | `SandboxConnect` revoke handler — sets `is_active = false` |

**For any failed check:** Fix the issue directly, then re-verify.

**Output:** `SECURITY_AUDIT.md`:
```markdown
# Security Audit Report

## Results
| Check | Status | Notes |
|-------|--------|-------|
| Production URL — frontend | PASS/FAIL | ... |
...

## Issues Found & Fixed
[list any issues that were found and how they were resolved]

## Sign-off
All 10 security checks passed.
```

---

## Agent Communication Protocol

### Shared Context Rule
Every agent **must** read `RECON_MIGRATIONS.md` and `RECON_PROJECT.md` before doing any work. These are the ground truth. Never assume column names, enum values, or file paths — always reference the recon reports.

### Conflict Resolution
If two agents need to modify the same file:
- Only Agent 3A modifies `TicketDetail` and the router file
- Phase 2 agents create new files only — they never modify existing files
- If a conflict arises, the later agent in the execution order wins, but must preserve the earlier agent's additions

### Output Naming Convention
Every agent produces outputs at these paths:

```
RECON_MIGRATIONS.md                          ← Agent 0A
RECON_PROJECT.md                             ← Agent 0B
supabase/migrations/XXXXX_sandbox.sql        ← Agent 1A
.env.example                                 ← Agent 1B
docs/salesforce-setup.md                     ← Agent 1B
src/lib/salesforce-oauth.js                  ← Agent 1B
[backend file modified]                      ← Agent 1C
src/components/sandbox/SandboxConnect.jsx    ← Agent 2A
src/components/sandbox/SandboxCallback.jsx   ← Agent 2B
src/components/sandbox/SandboxDashboard.jsx  ← Agent 2C
[TicketDetail.jsx modified]                  ← Agent 3A
[router file modified]                       ← Agent 3A
SECURITY_AUDIT.md                            ← Agent 3B
```

### Handoff Format
When an agent completes, it must output a brief summary:

```
AGENT [ID] COMPLETE
Files produced: [list]
Files modified: [list]
Blockers for downstream agents: [any issues downstream agents must know about]
Ready for: [which agents can now start]
```

---

## Performance Notes

### Why Parallel?
- Phase 0 agents (0A + 0B) run in parallel — they read different parts of the codebase
- Phase 1 agents (1A + 1B + 1C) run in parallel — DB, Salesforce config, and backend are independent
- Phase 2 agents (2A + 2B + 2C) run in parallel — three separate component files with no shared state
- Only Phase 3 is sequential — integration must come before security audit

### Expected Speedup
Without parallelism: ~14 sequential tasks
With parallelism: ~5 sequential steps (0→1→2→3A→3B)
Estimated time reduction: ~60–65% faster than serial execution

### When to Break Parallelism
If the recon agents discover something unexpected (e.g. `sandbox_connections` already exists, or the backend doesn't exist yet), the orchestrator must pause all agents, assess the situation, and re-plan before continuing.

---

## Skill Usage Per Agent

| Agent | Skill | Why |
|-------|-------|-----|
| 0A, 0B | None | Pure reading and analysis |
| 1A | None | SQL only |
| 1B | None | Config and utility code |
| 1C | None | Backend endpoint code |
| 2A | `frontend-design` | Production-grade UI component |
| 2B | None | Logic-heavy, minimal UI |
| 2C | `frontend-design` | Production-grade UI component |
| 3A | None | File wiring and imports |
| 3B | None | Code review and verification |

Agents 2A and 2C must read `/mnt/skills/public/frontend-design/SKILL.md` as their first action before writing any component code.

---

## Definition of Done

The module is complete when:

- [ ] `RECON_MIGRATIONS.md` and `RECON_PROJECT.md` are produced
- [ ] Migration file runs cleanly on local Supabase
- [ ] All three components exist and import without errors
- [ ] `/oauth/callback` route is registered
- [ ] `SandboxConnect` renders correctly in `TicketDetail` under the right conditions
- [ ] End-to-end OAuth flow works with a real Salesforce sandbox
- [ ] `SECURITY_AUDIT.md` shows all 10 checks as PASS
- [ ] No TypeScript errors (if TypeScript is in use)
- [ ] `SF_CLIENT_SECRET` appears nowhere in `src/`
