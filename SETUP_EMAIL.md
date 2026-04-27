# Member Invite Email Setup

## Current Flow

Company member invites now use Supabase's existing password reset email flow. The app no longer sends or stores a random temporary password.

When an admin or partner adds a member:

1. They enter the member name, email, and company role.
2. The Edge Function resolves or creates the Supabase Auth user.
3. Supabase sends a password setup/reset email to `/reset-password`.
4. After that email is sent successfully, the function saves or updates:
   - `profiles.full_name`
   - `profiles.email`
   - `company_memberships.role`

If the reset email fails, membership details are not saved. If a brand-new auth user was created for the invite, it is rolled back.

## Required Supabase Auth Setup

In Supabase Dashboard:

1. Go to Authentication > URL Configuration.
2. Add your app URL to allowed redirect URLs.
3. Include:

```text
http://localhost:8080/reset-password
https://your-production-domain.com/reset-password
```

4. Configure Authentication > Email Templates > Reset Password if you want custom copy.

## Required Edge Function Environment

Set these variables for the `invite-member` function:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=https://your-app-url.example
ALLOWED_REDIRECT_ORIGINS=https://your-app-url.example
```

For local development:

```bash
APP_URL=http://localhost:8080
```

## Notes

- `RESEND_API_KEY` is not used by `invite-member` anymore.
- Resend may still be used by `resend-webhook` for ticket notifications.
- Set `RESEND_WEBHOOK_SECRET` on the `resend-webhook` function. The database webhook caller must sign the raw JSON body with HMAC-SHA256 using this secret and send `x-webhook-timestamp` plus `x-webhook-signature` headers.
- To enable CAPTCHA on sign-in and password reset, set `VITE_TURNSTILE_SITE_KEY` in the frontend environment and `TURNSTILE_SECRET_KEY` on the `auth-guard` Edge Function.
- If users do not receive reset emails, check Supabase Auth email settings, SMTP settings, and Auth logs.

## Related Files

- `supabase/functions/invite-member/index.ts`
- `src/lib/invite-member.ts`
- `src/pages/admin/company-members/AddMemberCard.tsx`
- `src/pages/admin/company-members/useAdminCompanyMembersPage.ts`
- `src/pages/CompanySettingsPage.tsx`
- `src/pages/AgentDashboardPage.tsx`
