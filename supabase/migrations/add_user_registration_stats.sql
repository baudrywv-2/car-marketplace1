-- User registration stats for admin (no external API)
-- Adds profiles.created_at, backfills from auth.users, and RPC for aggregated stats

-- 1. Add created_at to profiles (registration time)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Backfill from auth.users for existing profiles
UPDATE profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id AND (p.created_at IS NULL OR p.created_at > u.created_at);

-- 3. Ensure new signups get created_at (trigger already inserts profile; default handles it)
-- No change needed if column has DEFAULT now()

-- 4. RPC: admin-only registration stats (day/week/month/year + by role)
-- Uses SECURITY DEFINER to read profiles; returns only aggregates
CREATE OR REPLACE FUNCTION public.admin_get_registration_stats()
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
    'total', (SELECT count(*) FROM profiles),
    'sellers', (SELECT count(*) FROM profiles WHERE role = 'seller'),
    'buyers', (SELECT count(*) FROM profiles WHERE role = 'buyer'),
    'admins', (SELECT count(*) FROM profiles WHERE role = 'admin'),
    'byDay', (
      SELECT coalesce(jsonb_agg(d ORDER BY d->>'date' DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'date', to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
          'count', count(*),
          'sellers', count(*) FILTER (WHERE role = 'seller'),
          'buyers', count(*) FILTER (WHERE role = 'buyer'),
          'admins', count(*) FILTER (WHERE role = 'admin')
        ) AS d
        FROM profiles
        WHERE created_at IS NOT NULL
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
          'count', count(*),
          'sellers', count(*) FILTER (WHERE role = 'seller'),
          'buyers', count(*) FILTER (WHERE role = 'buyer'),
          'admins', count(*) FILTER (WHERE role = 'admin')
        ) AS w
        FROM profiles
        WHERE created_at IS NOT NULL
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
          'count', count(*),
          'sellers', count(*) FILTER (WHERE role = 'seller'),
          'buyers', count(*) FILTER (WHERE role = 'buyer'),
          'admins', count(*) FILTER (WHERE role = 'admin')
        ) AS m
        FROM profiles
        WHERE created_at IS NOT NULL
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
          'count', count(*),
          'sellers', count(*) FILTER (WHERE role = 'seller'),
          'buyers', count(*) FILTER (WHERE role = 'buyer'),
          'admins', count(*) FILTER (WHERE role = 'admin')
        ) AS y
        FROM profiles
        WHERE created_at IS NOT NULL
        GROUP BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY')
        ORDER BY to_char(created_at AT TIME ZONE 'UTC', 'YYYY') DESC
        LIMIT 10
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Only authenticated users can call; RPC itself checks is_admin()
GRANT EXECUTE ON FUNCTION public.admin_get_registration_stats() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_registration_stats() FROM anon;

COMMENT ON FUNCTION public.admin_get_registration_stats() IS 'Admin-only: returns aggregated user registration counts by day/week/month/year and by role (seller/buyer/admin). No PII.';
