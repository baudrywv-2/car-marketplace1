-- Add is_sold column for sellers to mark cars as sold
-- Run in Supabase → SQL Editor

ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT false;

-- Update RLS: public browse should exclude sold cars
DROP POLICY IF EXISTS "Public can browse approved cars" ON cars;
CREATE POLICY "Public can browse approved cars"
ON cars FOR SELECT
TO public
USING (
  is_approved = true
  AND (is_draft = false OR is_draft IS NULL)
  AND (is_sold = false OR is_sold IS NULL)
);
