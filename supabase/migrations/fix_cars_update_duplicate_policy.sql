-- Remove duplicate policies on cars (keep only consolidated ones)
DROP POLICY IF EXISTS "Cars: owners can insert own" ON cars;
DROP POLICY IF EXISTS "Cars: admin or owner update" ON cars;
DROP POLICY IF EXISTS "Authenticated can delete cars (admin or owner)" ON cars;
