# Consultant Dashboard Setup & Testing Guide

## Overview

The consultant dashboard is now fully functional. Consultants can:
- View all tickets assigned to them
- Accept/Decline ticket assignments
- Send completed work to UAT
- Track their work queue across three categories

## System Architecture

### Database

**User Roles:**
- Consultants are identified by `user_roles.role = 'consultant'`
- When a consultant is assigned to a ticket, the `user_roles` entry is automatically created

**Consultant Assignment Flow:**
```
Admin creates ticket
    ↓
Admin assigns consultant via `assign_ticket_to_consultant(ticketId, consultantUserId)`
    ↓
Database trigger creates `user_roles` entry with role='consultant'
    ↓
Consultant logs in
    ↓
`useUserRole()` returns role='consultant'
    ↓
DashboardPage redirects to `/consultant/dashboard`
    ↓
Consultant sees 3 work queues with assigned tickets
```

### Components

**Route: `/consultant/dashboard`**
- File: `src/pages/AgentDashboardPage.tsx`
- Guard: `RoleAccessGuard` with policy="consultant"
- Displays when: `role === "consultant"`

**Three Work Queues:**
1. **Newly Assigned** - Shows pending assignments that need accept/decline
2. **Active In Progress** - Shows accepted assignments currently being worked on
3. **Assigned History** - Shows all other assignments (completed, UAT, rejected, etc.)

### Redirect Logic

**When consultant logs in:**
1. `AuthContext` fetches user and profile
2. `useUserRole()` queries `user_roles` table → returns `role='consultant'`
3. `DashboardPage` checks role:
   - If `role === 'consultant'` → Redirect to `/consultant/dashboard` ✓
   - Otherwise → Show general dashboard

## Setup Steps

### Step 1: Deploy Migration

```bash
# From project root
supabase db push

# Or manually run migration
supabase migration up
```

This creates:
- Trigger function `ensure_consultant_role_on_assignment()`
- Automatically assigns consultant role when consultant is assigned to ticket
- Backfills existing consultants

### Step 2: Create Test Consultant User

1. Go to `/auth` → Sign up as a new user with:
   - Email: `consultant@test.com`
   - Password: (any strong password)

2. Login to admin panel → Admin > Users

3. Find the new consultant user

4. **DO NOT manually set role yet** - Let the assignment trigger handle it

### Step 3: Assign Consultant to a Ticket

1. Go to Admin > Tickets

2. Create a test ticket or select an existing one with status "approved"

3. Click on the ticket to open details

4. Look for "Assign Consultant" button/section

5. Assign your test consultant user

6. Admin function called: `assign_ticket_to_consultant(ticketId, consultantUserId, note)`

7. This should:
   - Create `user_roles` entry with role='consultant' (via trigger)
   - Set `tickets.assigned_consultant_id = consultantUserId`
   - Set `tickets.assignment_status = 'pending'`

### Step 4: Test Consultant Login Flow

1. Logout from admin panel

2. Navigate to `/auth` (or `/dashboard`)

3. Login with consultant credentials:
   - Email: `consultant@test.com`
   - Password: (same as signup)

4. **Expected behavior:**
   - AuthContext loads user and profile
   - useUserRole() queries and returns role='consultant'
   - DashboardPage detects role='consultant'
   - Redirects to `/consultant/dashboard` ✓

5. **At `/consultant/dashboard`:**
   - Should see AgentDashboardPage component
   - "Consultant Work Queue" section visible
   - "Newly Assigned Tickets" card shows 1 (the ticket just assigned)
   - Ticket appears in "Newly Assigned Tickets" table

### Step 5: Test Consultant Actions

#### Accept Assignment
1. In "Newly Assigned Tickets" table
2. Click "Accept" button
3. Expected:
   - `assignment_status` changes from 'pending' → 'accepted'
   - `status` changes from 'approved' → 'in_progress'
   - Ticket moves to "Active In Progress" queue
   - Button changes to "Send UAT"

#### Decline Assignment
1. Assign another ticket
2. Click "Decline" button
3. Expected:
   - `assignment_status` changes from 'pending' → 'rejected'
   - Ticket moves to "Assigned History"
   - Ticket becomes unassigned (goes back to admin)

#### Send to UAT
1. Accept a ticket (now in "Active In Progress")
2. Click "Send UAT" button
3. Expected:
   - `status` changes from 'in_progress' → 'uat'
   - Ticket moves to "Assigned History"
   - Client can now review and approve/reject

### Step 6: Test Multi-Consultant Scenario

1. Create 2nd consultant user
2. Assign them to 2 different tickets
3. Both should:
   - Automatically get `user_roles` entry with role='consultant'
   - See `/consultant/dashboard` on login
   - See only their own assigned tickets (filtered by assigned_consultant_id)

## Troubleshooting

### Consultant Stays on `/dashboard`

**Symptoms:**
- Consultant logs in
- Stays on `/dashboard` instead of redirecting to `/consultant/dashboard`

**Diagnosis:**
1. Open browser DevTools → Console
2. Look for errors
3. Check Network tab:
   - Is `user_roles` query being made?
   - Does it return a role?

**Fix:**
1. Verify migration ran: `supabase migration list`
2. Check `user_roles` table directly:
   ```sql
   SELECT user_id, role FROM user_roles
   WHERE user_id = '...(consultant-id)...';
   ```
3. If no row, manually insert:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('(consultant-user-id)', 'consultant');
   ```

### "Newly Assigned" Queue Shows 0 Tickets

**Cause:** Consultant was assigned but trigger didn't fire

**Fix:**
1. Check database trigger exists:
   ```sql
   SELECT trigger_name FROM information_schema.triggers
   WHERE table_schema = 'public'
   AND table_name = 'tickets'
   AND trigger_name = 'tickets_ensure_consultant_role';
   ```
2. If missing, run migration again

### RPC Calls Fail (Accept/Decline/Send UAT)

**Symptoms:**
- Click "Accept" → Red toast error appears
- Console shows error from RPC

**Likely causes:**
1. RLS policy preventing update
2. RPC function doesn't exist
3. Consultant doesn't have permission

**Fix:**
1. Check RPC exists: `consultant_respond_ticket_assignment`
2. Check RLS policies on `tickets` table
3. Verify consultant can update their own assigned tickets

## Key Files Reference

| Purpose | File |
|---------|------|
| Consultant dashboard UI | `src/pages/AgentDashboardPage.tsx` lines 912-1097 |
| Route configuration | `src/routes/index.tsx` lines 103-109 |
| Role guard | `src/components/RoleAccessGuard.tsx` lines 38-41 |
| Redirect logic | `src/pages/DashboardPage.tsx` lines 158-161 |
| Auto-role trigger | `supabase/migrations/20260424000000_...sql` |
| User role hook | `src/hooks/useUserRole.ts` |

## Verification Checklist

- [ ] Migration deployed successfully
- [ ] Test consultant user created
- [ ] Consultant assigned to ticket via admin
- [ ] Consultant role appears in `user_roles` table
- [ ] Consultant can login
- [ ] Dashboard redirects to `/consultant/dashboard`
- [ ] Consultant sees "Consultant Work Queue" section
- [ ] Newly Assigned Tickets shows the assigned ticket
- [ ] Accept button works → ticket moves to Active In Progress
- [ ] Send UAT button works → ticket moves to history
- [ ] Decline button works → ticket goes back to admin

## Database Trigger Details

**Trigger Name:** `tickets_ensure_consultant_role`  
**Table:** `public.tickets`  
**Events:** INSERT, UPDATE  
**Function:** `ensure_consultant_role_on_assignment()`

**What it does:**
```sql
WHEN assigned_consultant_id is set or changed:
  ├─ Check if consultant already has 'consultant' role
  ├─ If not → INSERT into user_roles with role='consultant'
  └─ If conflict → UPDATE role to 'consultant'
```

**Side effects:**
- Automatic role assignment
- No manual admin steps needed
- Works for bulk imports
- Idempotent (safe to run multiple times)

---

**Last Updated:** 2026-04-24  
**Consultant Dashboard Status:** ✅ Fully Functional
