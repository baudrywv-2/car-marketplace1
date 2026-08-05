-- Optional filters JSON on search_logs for richer analytics.
-- Run manually in Supabase SQL editor if migrations are not auto-applied.

ALTER TABLE public.search_logs
  ADD COLUMN IF NOT EXISTS filters jsonb;

COMMENT ON COLUMN public.search_logs.filters IS
  'Optional extra filter snapshot (type, fuel, transmission, priceRange, etc.)';
