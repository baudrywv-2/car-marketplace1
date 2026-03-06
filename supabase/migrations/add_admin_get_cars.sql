-- Admin listings: RPC to fetch all cars (bypasses RLS) so admin always sees pending submissions
-- Fixes: admin not seeing new seller car submissions when RLS or is_admin() has issues

-- Ensure is_admin exists (from fix-admin-dashboard.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;

-- RPC: admins get all cars; non-admins get empty (bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_get_cars()
RETURNS SETOF cars
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.cars
  WHERE public.is_admin()
  ORDER BY boost_score DESC NULLS LAST, created_at DESC;
$$;
