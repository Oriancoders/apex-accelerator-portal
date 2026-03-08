-- Add difficulty_level enum
CREATE TYPE public.ticket_difficulty AS ENUM ('easy', 'medium', 'hard', 'expert');

-- Add difficulty_level column to tickets
ALTER TABLE public.tickets ADD COLUMN difficulty_level public.ticket_difficulty NULL;