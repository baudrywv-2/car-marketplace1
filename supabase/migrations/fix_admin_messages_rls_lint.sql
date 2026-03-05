-- Fix auth.uid() re-evaluation per row in admin_messages RLS
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

DROP POLICY IF EXISTS "Admin messages: sellers read" ON admin_messages;
CREATE POLICY "Admin messages: sellers read"
ON admin_messages FOR SELECT TO authenticated
USING (
  target_audience = 'sellers'
  AND EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Admin messages: buyers read" ON admin_messages;
CREATE POLICY "Admin messages: buyers read"
ON admin_messages FOR SELECT TO authenticated
USING (
  target_audience = 'buyers'
  AND NOT (SELECT public.is_admin())
  AND NOT EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = (SELECT auth.uid()))
);
