-- FIX: Admin dashboard empty / admin can't see sellers' listings
-- Run in Supabase → SQL Editor
--
-- Uses SECURITY DEFINER function to bypass RLS when checking admin role

-- 1. Profiles: add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'seller';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. Set yourself as admin - run with YOUR email:
--    UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'your@email.com');

-- 3. Function to check admin (bypasses RLS - runs with definer rights)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;

-- 4. Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can select own profile" ON profiles;
CREATE POLICY "Users can select own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 5. Cars RLS: admins see all cars (uses is_admin() which bypasses profiles RLS)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can select all cars" ON cars;
CREATE POLICY "Admins can select all cars"
ON cars FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all cars" ON cars;
CREATE POLICY "Admins can update all cars"
ON cars FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (true);

-- 6. Owner + public policies
DROP POLICY IF EXISTS "Owners can select own cars" ON cars;
CREATE POLICY "Owners can select own cars"
ON cars FOR SELECT TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Public can browse approved cars" ON cars;
CREATE POLICY "Public can browse approved cars"
ON cars FOR SELECT TO public
USING (is_approved = true AND (is_draft = false OR is_draft IS NULL));
