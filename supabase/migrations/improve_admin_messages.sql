-- Improve admin messaging: drafts, archive, single-user targeting
-- Run in Supabase → SQL Editor

ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_target_audience_check;

ALTER TABLE admin_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Backfill any null status
UPDATE admin_messages SET status = 'sent' WHERE status IS NULL OR status = '';

ALTER TABLE admin_messages DROP CONSTRAINT IF EXISTS admin_messages_status_check;
ALTER TABLE admin_messages
  ADD CONSTRAINT admin_messages_status_check
  CHECK (status IN ('draft', 'sent', 'archived'));

ALTER TABLE admin_messages
  ADD CONSTRAINT admin_messages_target_audience_check
  CHECK (target_audience IN ('sellers', 'buyers', 'user'));

CREATE INDEX IF NOT EXISTS admin_messages_status_idx ON admin_messages(status);
CREATE INDEX IF NOT EXISTS admin_messages_recipient_idx ON admin_messages(recipient_user_id)
  WHERE recipient_user_id IS NOT NULL;

-- Admin update (drafts / archive)
DROP POLICY IF EXISTS "Admin messages: admin update" ON admin_messages;
CREATE POLICY "Admin messages: admin update"
ON admin_messages FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Recipients: only sent, non-archived messages
DROP POLICY IF EXISTS "Admin messages: sellers read" ON admin_messages;
DROP POLICY IF EXISTS "Admin messages: buyers read" ON admin_messages;
DROP POLICY IF EXISTS "Admin messages: recipient read" ON admin_messages;
DROP POLICY IF EXISTS "Admin messages: select consolidated" ON admin_messages;

CREATE POLICY "Admin messages: select consolidated"
ON admin_messages FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR (
    status = 'sent'
    AND archived_at IS NULL
    AND (
      (target_audience = 'sellers' AND EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = (SELECT auth.uid())))
      OR (
        target_audience = 'buyers'
        AND NOT public.is_admin()
        AND NOT EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = (SELECT auth.uid()))
      )
      OR (target_audience = 'user' AND recipient_user_id = (SELECT auth.uid()))
    )
  )
);
