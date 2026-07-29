-- =============================================================================
-- OBSOLETE for the Next.js app (kept for reference only)
-- =============================================================================
-- Admin listings now load via /api/admin/cars using SUPABASE_SERVICE_ROLE_KEY.
-- You do NOT need to run this script for the dashboard to show pending ads.
--
-- Optional: still useful if you want is_admin() / admin_get_cars() in Supabase
-- for direct SQL / debugging. Replace the email below only if you use it.
-- =============================================================================

-- 1. Ensure profiles has role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'seller';

-- 2. Set YOUR admin account (REPLACE email)
UPDATE profiles SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'your-admin@example.com');

-- 3. is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;

-- 4. admin_get_cars() (optional; app uses service-role API instead)
CREATE OR REPLACE FUNCTION public.admin_get_cars()
RETURNS SETOF cars
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.cars
  WHERE public.is_admin()
  ORDER BY boost_score DESC NULLS LAST, created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_cars() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_cars() FROM anon;
