-- Presence: last activity timestamp for online / last-seen indicators
-- Run in Supabase → SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON public.profiles(last_seen DESC NULLS LAST);

COMMENT ON COLUMN public.profiles.last_seen IS 'Updated by client heartbeat while the user has the app open.';
