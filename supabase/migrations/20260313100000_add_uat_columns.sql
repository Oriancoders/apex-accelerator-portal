-- Add UAT tracking columns to tickets table
ALTER TABLE "public"."tickets" 
ADD COLUMN IF NOT EXISTS "uat_attachments" text[] DEFAULT NULL;

ALTER TABLE "public"."tickets" 
ADD COLUMN IF NOT EXISTS "uat_notes" text DEFAULT NULL;
