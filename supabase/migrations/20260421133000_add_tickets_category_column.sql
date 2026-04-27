BEGIN;

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

COMMIT;
