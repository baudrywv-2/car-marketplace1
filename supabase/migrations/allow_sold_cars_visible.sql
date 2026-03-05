-- Allow sold cars to remain visible in browse (shown with "Sold" badge)
-- Run after add_is_sold.sql

DROP POLICY IF EXISTS "Public can browse approved cars" ON cars;
CREATE POLICY "Public can browse approved cars"
ON cars FOR SELECT
TO public
USING (
  is_approved = true
  AND (is_draft = false OR is_draft IS NULL)
);
