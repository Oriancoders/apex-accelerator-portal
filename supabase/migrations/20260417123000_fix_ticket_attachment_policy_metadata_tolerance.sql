-- Fix ticket attachment upload failures when storage metadata keys are missing at insert time.
-- Keep extension/type/size constraints, but only enforce type/size when metadata is present.

DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;

CREATE POLICY "Users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(storage.extension(name)) = ANY (ARRAY['pdf', 'jpg', 'jpeg', 'png'])
  AND (
    COALESCE(metadata->>'mimetype', '') = ''
    OR lower(metadata->>'mimetype') = ANY (ARRAY['application/pdf', 'image/jpeg', 'image/png'])
  )
  AND (
    COALESCE(metadata->>'size', '') = ''
    OR (
      (metadata->>'size')::bigint > 0
      AND (metadata->>'size')::bigint <= 10485760
    )
  )
);

NOTIFY pgrst, 'reload schema';
