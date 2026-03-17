-- Harden ticket attachment upload validation at storage policy level.
-- Enforces approved extensions, MIME types, and size limits server-side.

DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;

CREATE POLICY "Users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) = ANY (ARRAY['pdf', 'jpg', 'jpeg', 'png'])
  AND lower(COALESCE(metadata->>'mimetype', '')) = ANY (ARRAY['application/pdf', 'image/jpeg', 'image/png'])
  AND COALESCE((metadata->>'size')::bigint, 0) > 0
  AND COALESCE((metadata->>'size')::bigint, 0) <= 10485760
);

NOTIFY pgrst, 'reload schema';
