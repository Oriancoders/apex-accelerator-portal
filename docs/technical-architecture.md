# Apex Accelerator Portal - Technical Architecture

## 1. Purpose and Scope
Apex Accelerator Portal is a multi-role Salesforce service operations platform.

Primary goals:
- Provide secure user authentication and role-aware access.
- Support ticket creation, lifecycle tracking, and real-time status visibility.
- Implement a credit economy (purchase, usage, ledgering).
- Implement a controlled withdrawal workflow with admin settlement.
- Support multi-tenant company workspaces using slug-based routing.

This document describes architecture, system boundaries, core workflows, and operational guidance.

## 2. Runtime Stack
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui + Framer Motion
- Routing: React Router
- Data fetching/cache: TanStack Query
- Backend: Supabase (Auth + Postgres + RLS + Edge Functions)
- Hosting: Vercel (SPA rewrites + security headers)

## 3. High-Level Architecture
1. Browser loads SPA from Vercel.
2. React app resolves route and applies guard layers.
3. Supabase client handles auth/session, table reads/writes, RPC, and edge function invocation.
4. Postgres enforces row-level authorization (RLS) and transactional consistency.
5. Admin-only sensitive state transitions are finalized via SQL function (RPC).

## 4. Codebase Entry Points
- Routing: src/routes/index.tsx
- Auth state provider: src/contexts/AuthContext.tsx
- Layout-level protection: src/components/ProtectedLayout.tsx
- Policy-level protection: src/components/RoleAccessGuard.tsx
- Auth UI/flows: src/pages/AuthPage.tsx
- Ticketing UI: src/pages/TicketsPage.tsx
- Credits + withdrawal user UI: src/pages/CreditsPage.tsx
- Admin credits + withdrawals: src/pages/admin/AdminCreditsPage.tsx
- Credit settings hook: src/hooks/useCreditSettings.ts
- Deployment rewrite/security: vercel.json
- Withdrawal schema + RPC: supabase/migrations/20260316160000_add_credit_withdrawal_requests.sql

## 5. Routing and Navigation Model
### 5.1 Public Routes
- /auth
- /reset-password

### 5.2 App Routes
- /dashboard
- /tickets, /tickets/new, /tickets/:id
- /credits
- Content and profile routes
- Multi-tenant routes: /:slug/dashboard, /:slug/tickets, /:slug/settings

### 5.3 Admin Routes
- /admin and admin subpages for tickets/users/credits/content/operations.

### 5.4 Production Refresh Behavior
Vercel rewrite in vercel.json sends non-asset, non-api paths to /index.html to prevent 404 on deep-link refresh.

## 6. Authentication and Session Lifecycle
Implemented in src/contexts/AuthContext.tsx and src/pages/AuthPage.tsx.

Lifecycle:
1. App subscribes to Supabase auth state changes.
2. On session present, user/session state is stored.
3. Profile is loaded from profiles table.
4. On sign-out, user/session/profile are cleared.
5. Guest login mode is supported for read-only exploration.

Auth mechanisms:
- Email/password sign in.
- Email/password sign up.
- OAuth providers from auth page.
- Forgot-password reset trigger.

Post-login destination resolution:
- Admin -> /admin
- Active agent -> /agent/dashboard
- Others -> /dashboard

## 7. Authorization and Guard Layers
### 7.1 Guard Layer 1: ProtectedLayout
src/components/ProtectedLayout.tsx
- Blocks anonymous access to app routes.
- Handles edge behavior for agents without active company.
- Preserves access for allowed global routes (for example credits).

### 7.2 Guard Layer 2: RoleAccessGuard
src/components/RoleAccessGuard.tsx
Policies:
- admin
- agent
- company_dashboard
- company_manage

Behavior:
- Validates auth + role + tenant membership.
- Uses slug parameter to resolve target company membership.
- Restricts company management pages to elevated membership.

### 7.3 Backend Enforcement
RLS policies in Postgres are the final authority for data access and mutation.
Frontend guards improve UX; backend guards enforce security.

## 8. Multi-Tenant Company Context
Tenant model:
- Company-scoped routes use a slug in path.
- Membership resolution determines allowed company access.
- System admin can cross company scopes for supervision tasks.

Expected behavior:
- company_admin/member users view company-scoped tickets and dashboards.
- Non-members are redirected away from unauthorized company routes.

## 9. Ticketing Subsystem
Primary page: src/pages/TicketsPage.tsx

Capabilities:
- Role-aware ticket query composition (personal vs company context).
- Status-based filtering (all, active, completed, cancelled).
- New ticket creation path selection based on active context.
- Live updates via Supabase realtime subscription on tickets table.

Real-time behavior:
- Query invalidation on row changes.
- UI pulse + notifications on status changes.

## 10. Credits and Billing Subsystem
Primary page: src/pages/CreditsPage.tsx

### 10.1 Credit Settings
Hook: src/hooks/useCreditSettings.ts
- Reads configurable rates/packages from credit_settings table.
- Supplies defaults when settings are absent.
- Supports admin updates via upsert.

### 10.2 Purchase Flow
1. User selects package.
2. Frontend invokes create-credit-checkout edge function.
3. User completes external payment.
4. App receives session_id callback.
5. verify-credit-payment edge function validates and applies credit update.
6. UI refreshes profile and transaction ledger.

### 10.3 Ledger
- credit_transactions table tracks all balance-impacting events.
- User sees paginated history.
- Admin sees full transaction stream with filters.

## 11. Withdrawal Subsystem
Core schema + policies + RPC:
- supabase/migrations/20260316160000_add_credit_withdrawal_requests.sql

### 11.1 Data Model
credit_withdrawal_requests includes:
- requester identity
- requested credits
- payout method/account details
- workflow status
- admin notes + payout reference
- link to resulting credit transaction
- processor metadata and timestamps

### 11.2 User Flow
In src/pages/CreditsPage.tsx:
1. User enters amount, method, account details, optional note.
2. Frontend validates amount, min threshold, balance, and details.
3. Request is inserted with pending status.
4. User sees status history.

### 11.3 Admin Flow
In src/pages/admin/AdminCreditsPage.tsx:
1. Admin reviews request queue.
2. Approves/rejects as needed.
3. After manual external payout, clicks Mark Paid.
4. RPC finalizes financial state atomically.

### 11.4 Atomic Finalization RPC
Function: admin_mark_withdrawal_paid
- Verifies admin role.
- Locks target request row.
- Ensures only pending/approved can be paid.
- Deducts user credits with insufficient-balance guard.
- Inserts matching deduction transaction.
- Marks request paid with processing metadata.

This removes partial-update risk and enforces consistency in one transaction boundary.

## 12. Admin Financial Controls
In src/pages/admin/AdminCreditsPage.tsx:
- Global transaction analytics and filtering.
- Withdrawal operations queue.
- Minimum withdrawal credits setting.

Minimum withdrawal setting is consumed in user flow via useCreditSettings and enforced during request submission.

## 13. Deployment and Security Notes
### 13.1 Hosting
- Vercel serves static SPA output.
- SPA fallback rewrite is required for deep links.

### 13.2 Security Header
vercel.json sets CSP frame-ancestors 'none' to prevent framing/clickjacking.

### 13.3 Auth Redirect Integrity
Auth redirects should always be aligned with:
- Supabase Auth Site URL
- Allowed redirect URLs
- Frontend redirect construction strategy

## 14. Operational Runbook (Concise)
### 14.1 New User Onboarding
1. User signs up from /auth.
2. User confirms email.
3. User logs in and is routed by role.

### 14.2 Ticket Handling
1. User creates ticket.
2. Team/agent updates status.
3. User sees live progress and completion state.

### 14.3 Credit Purchase
1. User purchases package.
2. Payment callback verified.
3. Credits applied and transaction recorded.

### 14.4 Withdrawal Settlement
1. User submits request.
2. Admin reviews and pays manually outside system.
3. Admin marks paid.
4. System deducts credits and records ledger entry.

## 15. Current Strengths
- Good separation of concerns across routing, auth, policy guard, and domain pages.
- Multi-tenant route strategy is explicit and readable.
- Financially sensitive workflow uses transactional DB logic.
- User/admin credit visibility is clear and query-friendly.

## 16. Recommended Next Improvements
1. Centralize auth redirect URL builder to avoid environment mismatch.
2. Add structured audit logs for admin withdrawal actions.
3. Add idempotency checks for payout finalization retries.
4. Add architecture diagrams (sequence + data model) in docs for onboarding.
5. Add test coverage for role/tenant route guards and payout RPC edge cases.
