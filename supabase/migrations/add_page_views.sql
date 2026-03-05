-- Visitor tracking (no external API)
-- One row per session; admin aggregates by day/week/month/year

CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (client logs visits)
DROP POLICY IF EXISTS "page_views: allow insert" ON public.page_views;
CREATE POLICY "page_views: allow insert"
ON public.page_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No direct select; admin uses RPC
DROP POLICY IF EXISTS "page_views: no select" ON public.page_views;
-- (No SELECT policy = no one can read directly; RPC uses SECURITY DEFINER)

CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views(created_at);

-- Admin-only RPC: aggregated visit stats
CREATE OR REPLACE FUNCTION public.admin_get_visit_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
BEGIN
  SELECT public.is_admin() INTO is_admin;
  IF NOT is_admin THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM page_views),
    'byDay', (
      SELECT coalesce(jsonb_agg(d ORDER BY d->>'date' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'date', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
          'count', count(*)
        ) AS d
        FROM page_views
        GROUP BY (created_at AT TIME ZONE 'UTC')::date
        ORDER BY (created_at AT TIME ZONE 'UTC')::date DESC
        LIMIT 366
      ) t
    ),
    'byWeek', (
      SELECT coalesce(jsonb_agg(w ORDER BY w->>'week' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'week', date_trunc('week', created_at AT TIME ZONE 'UTC')::date::text,
          'count', count(*)
        ) AS w
        FROM page_views
        GROUP BY date_trunc('week', created_at AT TIME ZONE 'UTC')
        ORDER BY date_trunc('week', created_at AT TIME ZONE 'UTC') DESC
        LIMIT 104
      ) t
    ),
    'byMonth', (
      SELECT coalesce(jsonb_agg(m ORDER BY m->>'month' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'month', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM'),
          'count', count(*)
        ) AS m
        FROM page_views
        GROUP BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM')
        ORDER BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM') DESC
        LIMIT 24
      ) t
    ),
    'byYear', (
      SELECT coalesce(jsonb_agg(y ORDER BY y->>'year' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'year', to_char(created_at AT TIME ZONE 'UTC', 'YYYY'),
          'count', count(*)
        ) AS y
        FROM page_views
        GROUP BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY')
        ORDER BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY') DESC
        LIMIT 10
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_visit_stats() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_visit_stats() FROM anon;

COMMENT ON TABLE public.page_views IS 'One row per visitor session. Logged client-side; admin aggregates via RPC.';
