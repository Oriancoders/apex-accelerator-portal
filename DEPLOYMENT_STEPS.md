# Consultant Dashboard - Deployment Steps

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Deploy Database Migration
```bash
cd /path/to/apex-accelerator-portal
supabase db push
```

**What this does:**
- Creates `ensure_consultant_role_on_assignment()` trigger function
- Automatically assigns `consultant` role when consultant is assigned to a ticket
- Backfills any existing consultant assignments

**Expected output:**
```
Applying migration: supabase/migrations/20260424000000_ensure_consultant_role_on_assignment.sql
✓ Migration applied successfully
```

### Step 2: Restart Development Server (if running)
```bash
# Stop current dev server (Ctrl+C)
# Then restart
npm run dev
```

**Why:** Ensures TypeScript/Vite picks up any cache changes

### Step 3: Test Basic Flow

1. **Create consultant user:**
   - Go to http://localhost:8082 (or your port)
   - Click "Sign Up"
   - Email: `consultant@test.com`
   - Password: (any strong password)
   - Submit

2. **Login as admin and assign:**
   - Logout consultant
   - Go to `/auth`
   - Login with admin credentials
   - Navigate to Admin > Tickets
   - Select any ticket with status "approved" (or "under_review")
   - Find "Assign Consultant" option
   - Select `consultant@test.com`
   - Click Assign

3. **Login as consultant and verify:**
   - Logout from admin
   - Go to `/auth`
   - Login with consultant credentials:
     - Email: `consultant@test.com`
     - Password: (same as signup)
   - **Expected:** Auto-redirect to `/consultant/dashboard` ✓

4. **Check dashboard:**
   - Should see "Consultant Work Queue" heading
   - Stats card should show "Newly Assigned: 1"
   - Table should show the assigned ticket
   - "Accept" button should be visible

---

## ✅ Verification Checklist

After deployment, verify each item:

### Database Level
- [ ] Migration ran without errors
- [ ] Trigger function exists:
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_name = 'ensure_consultant_role_on_assignment';
  ```
- [ ] Consultant role was created:
  ```sql
  SELECT * FROM user_roles WHERE role = 'consultant' LIMIT 1;
  ```

### Application Level  
- [ ] Consultant can login without errors
- [ ] Dashboard auto-redirects to `/consultant/dashboard`
- [ ] Consultant Work Queue section visible
- [ ] Assigned ticket appears in "Newly Assigned" table
- [ ] Accept button is clickable
- [ ] No console errors (F12 → Console)

### Functionality Level
- [ ] **Accept** button works → ticket moves to Active In Progress
- [ ] **Decline** button works → ticket returns to admin  
- [ ] **Send to UAT** button works → ticket moves to History
- [ ] **View** button works → opens ticket detail page

### Multi-User Level
- [ ] Create 2nd consultant account
- [ ] Assign to different ticket
- [ ] Both consultants see only their own tickets (RLS working)
- [ ] No cross-contamination of data

---

## 🐛 Troubleshooting

### Issue: Consultant redirects to /dashboard instead of /consultant/dashboard

**Step 1: Check role assignment**
```sql
SELECT * FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultant@test.com');
```
- Expected: One row with role='consultant'
- If empty: See "Issue: Migration didn't run" below

**Step 2: Check useUserRole query**
- Open browser DevTools (F12)
- Go to Network tab
- Refresh page
- Look for query to `user_roles` table
- Check if it returns the consultant's role

**Step 3: Check redirect logic**
- In DashboardPage.tsx line 160, role should be "consultant"
- Should match this condition: `role === "consultant"`

### Issue: Migration didn't run / PostgreSQL error

**Check migration exists:**
```bash
ls -la supabase/migrations/ | grep 20260424000000
```

**Re-run migration:**
```bash
supabase migration up 20260424000000
# Or push all migrations
supabase db push
```

**Check Supabase connection:**
```bash
supabase status
# Should show all services running
```

### Issue: Consultant sees no tickets in queue

**Step 1: Verify assignment**
```sql
SELECT id, title, assigned_consultant_id, assignment_status 
FROM tickets 
WHERE assigned_consultant_id = (
  SELECT id FROM auth.users WHERE email = 'consultant@test.com'
);
```
- Expected: Rows showing the assigned tickets
- If empty: Ticket may not be assigned to this consultant

**Step 2: Check ticket status**
- Assigned ticket should be in status "approved" or "in_progress"
- assignment_status should be "pending" or "accepted"

**Step 3: Check RLS Policy**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'tickets' 
AND policyname ILIKE '%consultant%';
```

### Issue: Accept/Decline/Send UAT buttons don't work

**Check RPC functions exist:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'consultant_%' 
OR routine_name LIKE 'assign_ticket%';
```

Expected functions:
- `assign_ticket_to_consultant`
- `consultant_respond_ticket_assignment`  
- `consultant_send_ticket_to_uat`

**Check console error:**
- F12 → Console → Look for error message
- Error will indicate which RPC failed

**Check RLS permissions:**
- Ensure consultant can UPDATE tickets table
- Ensure consultant can INSERT to ticket_events table

---

## 📊 Monitoring

### Key metrics to track:
- **Consultant login success rate:** Should be 100%
- **Redirect to dashboard:** Should happen automatically
- **Action completion rate:** Accept/Decline/Send to UAT
- **Average time on dashboard:** Should be < 2 minutes per action

### Logs to monitor:
```bash
# Supabase function logs
supabase functions serve

# Dev server logs  
npm run dev
# Look for React warnings or errors
```

---

## 🔄 Rollback (if needed)

If something goes wrong, you can revert the migration:

```bash
# Remove the migration (keeps data)
supabase migration down 20260424000000

# Or delete the migration file
rm supabase/migrations/20260424000000_ensure_consultant_role_on_assignment.sql

# Revert in Supabase
supabase db reset
```

**Note:** This will remove the automatic role assignment, but won't delete existing roles.

---

## 📞 Support Contacts

If you encounter issues:

1. **Check logs first:** Console, Supabase dashboard, network tab
2. **Review migration:** `supabase/migrations/20260424000000_*.sql`
3. **Test manually:** Run SQL queries to verify data
4. **Check configuration:** Verify Supabase keys in `.env`

---

## ✨ Success Criteria

Your deployment is successful when:

✅ Migration runs without error  
✅ Consultant user created  
✅ Admin assigns consultant to ticket  
✅ Role appears in user_roles table  
✅ Consultant logs in  
✅ Auto-redirects to `/consultant/dashboard`  
✅ Sees "Consultant Work Queue"  
✅ Sees assigned ticket in table  
✅ Accept/Decline/Send UAT buttons work  
✅ Multiple consultants can work independently  

---

**Expected deployment time:** 5 minutes  
**Tested on:** 2026-04-24  
**Status:** ✅ Ready for production
