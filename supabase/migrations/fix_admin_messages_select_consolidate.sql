-- Consolidate 3 SELECT policies into 1 for admin_messages (fixes multiple permissive policies lint)
-- Uses (SELECT auth.uid()) and (SELECT public.is_admin()) for performance

DROP POLICY IF EXISTS "Admin messages: admin select" ON admin_messages;
DROP POLICY IF EXISTS "Admin messages: sellers read" ON admin_messages;
DROP POLICY IF EXISTS "Admin messages: buyers read" ON admin_messages;

CREATE POLICY "Admin messages: authenticated select"
ON admin_messages FOR SELECT TO authenticated
USING (
  (SELECT public.is_admin())
  OR (
    target_audience = 'sellers'
    AND EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = (SELECT auth.uid()))
  )
  OR (
    target_audience = 'buyers'
    AND NOT (SELECT public.is_admin())
    AND NOT EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = (SELECT auth.uid()))
  )
);
