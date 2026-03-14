-- Traffic stats with optional date range filter
-- p_from_date, p_to_date: when both null = all time; when set = filter by created_at date

CREATE OR REPLACE FUNCTION public.admin_get_visit_stats_filtered(
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
  v_from timestamptz;
  v_to timestamptz;
BEGIN
  SELECT public.is_admin() INTO is_admin;
  IF NOT is_admin THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  IF p_from_date IS NOT NULL THEN
    v_from := p_from_date::timestamptz AT TIME ZONE 'UTC';
  ELSE
    v_from := '1970-01-01'::timestamptz;
  END IF;

  IF p_to_date IS NOT NULL THEN
    v_to := (p_to_date + interval '1 day')::timestamptz AT TIME ZONE 'UTC';
  ELSE
    v_to := '2100-01-01'::timestamptz;
  END IF;

  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM page_views WHERE created_at >= v_from AND created_at < v_to),
    'byDay', (
      SELECT coalesce(jsonb_agg(d ORDER BY d->>'date' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'date', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
          'count', count(*)
        ) AS d
        FROM page_views
        WHERE created_at >= v_from AND created_at < v_to
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
        WHERE created_at >= v_from AND created_at < v_to
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
        WHERE created_at >= v_from AND created_at < v_to
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
        WHERE created_at >= v_from AND created_at < v_to
        GROUP BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY')
        ORDER BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY') DESC
        LIMIT 10
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_visit_stats_filtered(date, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_visit_stats_filtered(date, date) FROM anon;
