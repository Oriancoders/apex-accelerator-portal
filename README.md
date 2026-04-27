# Customer Connect

Customer Connect is a multi-tenant service delivery portal for teams that need a controlled way to submit work requests, review proposals, approve delivery, and manage credits or company subscriptions.

The product is intentionally generalized: it is not tied to one implementation domain. It can support technical services, support operations, managed delivery teams, consultants, agencies, or partner-led client work.

## What It Does

- Lets clients submit service requests with rich descriptions, priority, contact details, and attachments.
- Gives admins a full operations dashboard for tickets, users, companies, consultants, agents, contacts, credits, and subscriptions.
- Supports company workspaces with slug-based routes such as `/:slug/dashboard` and `/:slug/tickets`.
- Uses role-based access for admins, company admins, members, agents, and consultants.
- Provides a credit economy for pay-as-you-go work, including purchases, deductions, withdrawals, and audit-friendly transaction history.
- Supports company subscriptions so subscribed companies can bypass per-ticket credit approval and move requests directly into delivery.
- Gives consultants a focused work queue for accepting assignments, moving work to UAT, and tracking assigned history.
- Includes notifications, ticket chat, ticket events, reviews, AI assistance, and email/reset flows.

## Core Workflows

### Client / Company User

1. Sign in or receive an invite from a company admin.
2. Submit a service request from the personal or company workspace.
3. Review the admin proposal, estimated effort, and credit cost.
4. Approve and pay with credits, or use an active company subscription.
5. Track progress through submitted, under review, approved, in progress, UAT, completed, or cancelled.
6. Chat on the ticket, review delivered work, and submit feedback.

### Admin

1. Review new tickets and contact submissions.
2. Build proposals with category, expert opinion, delivery steps, estimated hours, difficulty, and credit cost.
3. Assign consultants to approved tickets.
4. Manage users, roles, credits, withdrawals, agents, consultants, companies, and subscriptions.
5. Monitor operational, user, and finance metrics from the admin dashboard.

### Agent / Partner

1. Manage assigned companies and company members.
2. View company tickets, subscription status, commission context, and delivery activity.
3. Create company records and help onboard client teams.

### Consultant

1. View newly assigned, active, and historical tickets.
2. Accept or decline assignments.
3. Send completed work to UAT.
4. Keep assigned work isolated through role guards and database policies.

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- UI: shadcn/ui, Radix UI, Tailwind CSS, Lucide icons, Framer Motion
- Routing: React Router v6
- Data fetching: TanStack Query
- Backend: Supabase Auth, Postgres, Row Level Security, Storage, Realtime, Edge Functions
- Payments: Stripe Checkout for credit purchases
- Email: Supabase Auth emails and optional Resend ticket notifications
- AI: Supabase Edge Function wrapper around OpenAI chat completions
- Testing: Vitest
- Deployment: Vercel SPA hosting with rewrites and security headers

## Project Structure

```text
src/
  components/             Shared app components and domain components
  components/ui/          shadcn/ui primitives
  contexts/               Auth/session provider
  hooks/                  Role, tenant, credit, admin helper hooks
  integrations/supabase/  Supabase client and generated database types
  lib/                    Domain helpers for subscriptions, invites, errors, sanitization
  pages/                  Public, app, company, consultant, and admin pages
  routes/                 Central React Router configuration
  shared/                 Shared ticket/status/presentation components
supabase/
  functions/              Edge Functions
  migrations/             Database schema, RLS, triggers, and RPC migrations
docs/                     Architecture, security, setup, and design notes
```

## Important Routes

- `/auth` - sign in, sign up, password reset entry
- `/reset-password` - password setup/reset completion
- `/dashboard` - role-aware redirect and general dashboard
- `/tickets`, `/tickets/new`, `/tickets/:id` - personal ticket workflow
- `/:slug/dashboard`, `/:slug/tickets`, `/:slug/tickets/new`, `/:slug/settings` - company workspace
- `/credits` - credit purchase, ledger, and withdrawal flow
- `/pricing` - credit pricing explanation
- `/consultant/dashboard` - consultant work queue
- `/agent/dashboard` - agent/partner company workspace
- `/admin` and `/admin/*` - admin operations

## Roles

Application roles are stored in `public.user_roles`.

- `admin` - platform operator with full admin access
- `company_admin` - elevated company user who can manage company workspace/access
- `member` - normal company user
- `agent` - partner/agent user connected to companies and commissions
- `consultant` - delivery user assigned to tickets

Company membership roles are stored separately in `public.company_memberships.role`, including values such as `owner`, `admin`, `member`, and `billing`.

## Database Highlights

The Supabase migrations define the product backbone:

- Profiles and application roles
- Tickets, ticket events, ticket chat, reviews, updates, and attachments
- Companies, memberships, agents, agent-company assignments, and commission rules
- Credit settings, credit transactions, and withdrawal requests
- Subscription plans and company subscriptions
- Notifications, contact submissions, articles, news, and extensions
- RLS policies, validation triggers, rate-limit helpers, and transactional RPC functions

Key RPC functions include:

- `deduct_credits`
- `add_purchase_credits`
- `admin_adjust_credits`
- `admin_mark_withdrawal_paid`
- `assign_ticket_to_consultant`
- `consultant_respond_ticket_assignment`
- `consultant_send_ticket_to_uat`
- `client_reopen_ticket_from_uat`
- `purchase_company_subscription`
- `has_active_company_subscription`

## Edge Functions

The active backend logic lives in `supabase/functions/`:

- `auth-guard` - rate-limited sign-in and reset helper
- `invite-member` - company member invite and password setup flow
- `create-credit-checkout` - creates Stripe Checkout sessions for credit packages
- `verify-credit-payment` - verifies Stripe payment sessions and applies credits
- `ai-chat` - authenticated streaming AI assistant endpoint
- `resend-webhook` - optional ticket email notifications

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Supabase project or local Supabase CLI setup
- Stripe account if testing credit purchases
- OpenAI API key if testing AI chat
- Resend key if testing ticket email notifications

### Install

```bash
npm install
```

### Configure Environment

Create `.env` from `.env.example` and fill the values for your local project.

Required for the frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Required for Supabase Edge Functions, depending on which flows you test:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
RESEND_FROM=
APP_URL=http://localhost:8080
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

### Lint

```bash
npm run lint
```

## Supabase Notes

Apply migrations with:

```bash
supabase db push
```

Deploy Edge Functions as needed:

```bash
supabase functions deploy auth-guard
supabase functions deploy invite-member
supabase functions deploy create-credit-checkout
supabase functions deploy verify-credit-payment
supabase functions deploy ai-chat
supabase functions deploy resend-webhook
```

Set function secrets in Supabase before using production flows:

```bash
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_ANON_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set OPENAI_API_KEY=...
supabase secrets set RESEND_API_KEY=...
supabase secrets set APP_URL=...
```

## Security Model

- Frontend route guards improve navigation and UX.
- Supabase RLS is the final authority for data access.
- Sensitive operations use Edge Functions or Postgres RPC with role checks.
- Credit and withdrawal workflows use transaction-safe database functions.
- File uploads are validated in the client and constrained by storage policies.
- Auth and backend helper functions use database-backed rate limiting.
- User-facing errors are kept generic for sensitive flows.

## Useful Docs

- `SETUP_EMAIL.md` - member invite and password setup flow
- `docs/technical-architecture.md` - architecture notes
- `docs/design-system-theme.md` - design tokens and theme rules
- `docs/security-retest-checklist.md` - security retest checklist
- `CONSULTANT_SETUP_GUIDE.md` - consultant workflow setup
- `DEPLOYMENT_STEPS.md` - consultant deployment notes

## Deployment

The app is configured for Vercel as a single-page application. `vercel.json` rewrites application routes to `index.html` and sets security headers.

Production deployment checklist:

- Build passes with `npm run build`.
- Supabase migrations are applied.
- Edge Function secrets are configured.
- Supabase Auth redirect URLs include production and local reset/auth routes.
- Stripe, OpenAI, and Resend secrets are configured only where those features are enabled.
- Optional legacy integration variables are either configured or removed from the product path.
