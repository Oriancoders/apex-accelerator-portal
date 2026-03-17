-- Add company_id to tickets
ALTER TABLE "public"."tickets" 
ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "public"."companies"("id") ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "tickets_company_id_idx" ON "public"."tickets"("company_id");

-- Backfill: Assign tickets to the user's primary company if they have one
DO $$
BEGIN
  UPDATE "public"."tickets" t
  SET "company_id" = cm."company_id"
  FROM "public"."company_memberships" cm
  WHERE t."user_id" = cm."user_id"
  AND cm."is_primary" = true
  AND t."company_id" IS NULL;
END $$;
