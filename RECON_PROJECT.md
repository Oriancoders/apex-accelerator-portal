# Project Recon Report

## Router
- File: `src/routes/index.tsx` (consumed by `src/App.tsx`)
- Pattern: react-router-dom v6 config arrays (`publicRoutes`, `appRoutes`, `adminRoutes`, then mapped in `App.tsx`)
- How to add a route: add a route object in `src/routes/index.tsx`, e.g. `{ path: "/tickets/:id", element: <TicketDetailPage /> }`

## Supabase Client
- File: `src/integrations/supabase/client.ts`
- Import: `import { supabase } from '@/integrations/supabase/client'`

## TicketDetail Component
- File: `src/pages/TicketDetailPage.tsx`
- Data fetching: react-query (`useQuery` + Supabase calls)
- Ticket object shape: `{ id, user_id, title, description, priority, status, credit_cost, estimated_hours, solution_roadmap, created_at, updated_at, ... }` from `Tables<'tickets'>`
- How ticket is passed in: route param (`useParams`) used to fetch ticket by id

## UI Library
- Library: Shadcn UI + Radix primitives + Tailwind
- Button import example: `import { Button } from '@/components/ui/button'`

## TypeScript
- In use: YES
- Types file: `src/integrations/supabase/types.ts`

## Backend
- Type: Supabase Edge Functions
- Location: `supabase/functions/`

## Auth
- How to get current user: `const { user, profile, session } = useAuth()` from `src/contexts/AuthContext.tsx`

## Naming Conventions
- Files: `PascalCase.tsx` for components/pages, `index.ts` and lower-case for folders
- Imports: alias `@/` for `src/`, plus relative imports where needed

## Example: Adding a New Component to TicketDetail
Current import and usage pattern in `src/pages/TicketDetailPage.tsx` is direct component import from `@/components/...` and conditional rendering inside tabs/cards. For example:

```tsx
import ProtectedLayout from "@/components/ProtectedLayout";
import TicketTimeline from "@/shared/TicketTimeline";
import TimelineView from "@/components/TimelineView";

// later in JSX
<TicketTimeline events={events as any} updates={updates as any} />
<TimelineView events={events as any} updates={updates as any} />
```
