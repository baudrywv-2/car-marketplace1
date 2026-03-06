-- Extra optional profile fields for DRCCARS
-- Run this in Supabase → SQL Editor before deploying.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS bio text;

