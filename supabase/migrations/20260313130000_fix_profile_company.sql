-- Migration to replace 'company' text column with 'company_id' foreign key in profiles table

-- 1. Remove the text-based company name column
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS company;

-- 2. Add reference to companies table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
