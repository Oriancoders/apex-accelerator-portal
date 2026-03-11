
-- ticket_reviews table already exists now; just ensure realtime is set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ticket_reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_reviews;
  END IF;
END $$;
