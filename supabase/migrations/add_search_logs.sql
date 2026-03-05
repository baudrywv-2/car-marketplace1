-- Search analytics: track keywords and filters for admin insights
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text,
  make text,
  province text,
  min_price numeric,
  max_price numeric,
  listing_type text,
  event_type text,
  created_at timestamptz DEFAULT now()
);

-- RLS: allow anyone to insert (we log all searches), only admin to select
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_logs: allow insert" ON public.search_logs;
CREATE POLICY "search_logs: allow insert"
ON public.search_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "search_logs: admin select" ON public.search_logs;
CREATE POLICY "search_logs: admin select"
ON public.search_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
  )
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS search_logs_created_at_idx ON public.search_logs(created_at);
CREATE INDEX IF NOT EXISTS search_logs_keyword_idx ON public.search_logs(keyword) WHERE keyword IS NOT NULL;
CREATE INDEX IF NOT EXISTS search_logs_make_idx ON public.search_logs(make) WHERE make IS NOT NULL;
