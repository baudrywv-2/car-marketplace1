-- Allow admins to delete car listings
-- Run in Supabase → SQL Editor

DROP POLICY IF EXISTS "Admins can delete all cars" ON cars;
CREATE POLICY "Admins can delete all cars"
ON cars FOR DELETE
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
