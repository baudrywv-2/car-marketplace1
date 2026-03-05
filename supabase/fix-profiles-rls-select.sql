-- FIX: Dashboard + Contact settings
-- Run in Supabase → SQL Editor
--
-- Fixes: missing phone/whatsapp columns, RLS policies for profiles

-- 1. Add phone and whatsapp columns (if missing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp text;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow users to SELECT their own profile
DROP POLICY IF EXISTS "Users can select own profile" ON profiles;
CREATE POLICY "Users can select own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Allow users to INSERT their own profile (when missing - e.g. signed up before trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
