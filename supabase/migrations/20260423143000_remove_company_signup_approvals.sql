BEGIN;

-- Remove deprecated signup approval gating + company signup requests workflow.

-- Drop approval columns from profiles.
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS is_approved;

-- Drop company signup request workflow.
DROP TRIGGER IF EXISTS update_company_signup_requests_updated_at ON public.company_signup_requests;
DROP TRIGGER IF EXISTS on_company_signup_request_created_resend ON public.company_signup_requests;
DROP TRIGGER IF EXISTS on_company_signup_request_status_resend ON public.company_signup_requests;

DROP POLICY IF EXISTS "Admins can view company signup requests" ON public.company_signup_requests;
DROP POLICY IF EXISTS "Admins can update company signup requests" ON public.company_signup_requests;

DROP FUNCTION IF EXISTS public.admin_review_company_signup_request(uuid, boolean, text);

DROP TABLE IF EXISTS public.company_signup_requests CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;

