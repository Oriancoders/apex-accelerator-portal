-- Security hardening: role escalation, credit tampering, and upload validation

-- Ensure there is an explicit admin-only UPDATE policy for user roles.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Everyone can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Harden profile updates so non-admin users cannot modify credits directly.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND credits = (
    SELECT p.credits
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
    LIMIT 1
  )
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Harden storage upload rules with server-side extension allow-list.
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own ticket attachments" ON storage.objects;

CREATE POLICY "Users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(name) ~ '\\.(png|jpg|jpeg|gif|webp|pdf|doc|docx|xls|xlsx|txt|csv)$'
);

CREATE POLICY "Users can view own ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own ticket attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

NOTIFY pgrst, 'reload schema';
