-- Fix RLS lint issues on cars:
-- 1. Multiple permissive policies for authenticated SELECT → merge into one
-- 2. auth.uid() / auth functions re-evaluated per row → wrap in (SELECT ...)

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- ========== SELECT ==========
-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Admins can select all cars" ON cars;
DROP POLICY IF EXISTS "Owners can select own cars" ON cars;
DROP POLICY IF EXISTS "Public can browse approved cars" ON cars;

-- One policy for anon: browse approved non-draft cars
DROP POLICY IF EXISTS "Cars: anon browse approved" ON cars;
CREATE POLICY "Cars: anon browse approved"
ON cars FOR SELECT TO anon
USING (is_approved = true AND (is_draft = false OR is_draft IS NULL));

-- One policy for authenticated: approved cars OR own cars OR admin
DROP POLICY IF EXISTS "Cars: authenticated select" ON cars;
CREATE POLICY "Cars: authenticated select"
ON cars FOR SELECT TO authenticated
USING (
  is_approved = true AND (is_draft = false OR is_draft IS NULL)
  OR owner_id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

-- ========== INSERT ==========
DROP POLICY IF EXISTS "Owners can insert own cars" ON cars;
DROP POLICY IF EXISTS "Cars: owners can insert own" ON cars;
DROP POLICY IF EXISTS "Cars: authenticated insert" ON cars;
CREATE POLICY "Cars: authenticated insert"
ON cars FOR INSERT TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));

-- ========== UPDATE ==========
DROP POLICY IF EXISTS "Admins can update all cars" ON cars;
DROP POLICY IF EXISTS "Owners can update own cars" ON cars;
DROP POLICY IF EXISTS "Cars: admin or owner update" ON cars;
DROP POLICY IF EXISTS "Cars: authenticated update" ON cars;
CREATE POLICY "Cars: authenticated update"
ON cars FOR UPDATE TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
)
WITH CHECK (
  owner_id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);

-- ========== DELETE ==========
DROP POLICY IF EXISTS "Admins can delete all cars" ON cars;
DROP POLICY IF EXISTS "Owners can delete own cars" ON cars;
DROP POLICY IF EXISTS "Authenticated can delete cars (admin or owner)" ON cars;
DROP POLICY IF EXISTS "Cars: authenticated delete" ON cars;
CREATE POLICY "Cars: authenticated delete"
ON cars FOR DELETE TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);
