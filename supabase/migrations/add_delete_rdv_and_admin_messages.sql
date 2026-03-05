-- Allow admin to delete rendez-vous requests; buyers to delete their own.
-- Allow admin to delete sent admin messages.
-- Run in Supabase → SQL Editor

-- Rendez-vous: admin can delete any
DROP POLICY IF EXISTS "Rdv: admin can delete" ON rendezvous_requests;
CREATE POLICY "Rdv: admin can delete"
ON rendezvous_requests FOR DELETE
TO authenticated
USING (public.is_admin());

-- Rendez-vous: buyer can delete own request
DROP POLICY IF EXISTS "Rdv: buyer can delete own" ON rendezvous_requests;
CREATE POLICY "Rdv: buyer can delete own"
ON rendezvous_requests FOR DELETE
TO authenticated
USING (auth.uid() = buyer_id);

-- Admin messages: admin can delete (e.g. to clear old announcements)
DROP POLICY IF EXISTS "Admin messages: admin delete" ON admin_messages;
CREATE POLICY "Admin messages: admin delete"
ON admin_messages FOR DELETE
TO authenticated
USING (public.is_admin());
