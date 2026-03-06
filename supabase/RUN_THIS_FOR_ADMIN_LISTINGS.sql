-- =============================================================================
-- FIX: Admin not seeing seller submissions
-- Run this in Supabase Dashboard → SQL Editor → New query
-- =============================================================================
-- This creates the admin_get_cars RPC so admins always see ALL listings
-- (pending, approved, drafts) for review, approval, rejection, or deletion.
-- =============================================================================

-- 1. Ensure profiles has role column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'seller';

-- 2. Set YOUR admin account (REPLACE your-admin@example.com with your actual admin email)
UPDATE profiles SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'your-admin@example.com');

-- 3. is_admin() - used to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;

-- 4. admin_get_cars() - returns ALL cars for admins (bypasses RLS)
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

-- Done. Go to /dashboard/admin and click Refresh.
