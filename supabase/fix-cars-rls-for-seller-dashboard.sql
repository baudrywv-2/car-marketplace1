-- FIX: Seller dashboard not showing listings / drafts
-- Run in Supabase → SQL Editor
--
-- Problem: RLS on cars may block sellers from seeing their own cars (especially drafts).
-- This adds policies so owners can SELECT/UPDATE/DELETE their own cars,
-- and public can browse approved non-draft listings.

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- 1. Owners can SELECT their own cars (all statuses: draft, pending, approved)
DROP POLICY IF EXISTS "Owners can select own cars" ON cars;
CREATE POLICY "Owners can select own cars"
ON cars FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- 2. Owners can INSERT cars (with themselves as owner)
DROP POLICY IF EXISTS "Owners can insert own cars" ON cars;
CREATE POLICY "Owners can insert own cars"
ON cars FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- 3. Owners can UPDATE their own cars
DROP POLICY IF EXISTS "Owners can update own cars" ON cars;
CREATE POLICY "Owners can update own cars"
ON cars FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 4. Owners can DELETE their own cars
DROP POLICY IF EXISTS "Owners can delete own cars" ON cars;
CREATE POLICY "Owners can delete own cars"
ON cars FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 5. Admins can SELECT and UPDATE all cars (for admin dashboard, approve/reject)
DROP POLICY IF EXISTS "Admins can select all cars" ON cars;
CREATE POLICY "Admins can select all cars"
ON cars FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Admins can update all cars" ON cars;
CREATE POLICY "Admins can update all cars"
ON cars FOR UPDATE
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (true);

-- 6. Public can SELECT approved non-draft cars (for browse, car detail, etc.)
DROP POLICY IF EXISTS "Public can browse approved cars" ON cars;
CREATE POLICY "Public can browse approved cars"
ON cars FOR SELECT
TO public
USING (is_approved = true AND (is_draft = false OR is_draft IS NULL));
