-- Admin internal messages + discount notifications
-- Run in Supabase → SQL Editor

-- 1. Admin messages (broadcast to sellers or buyers)
CREATE TABLE IF NOT EXISTS admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_audience text NOT NULL CHECK (target_audience IN ('sellers', 'buyers')),
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS admin_messages_target_idx ON admin_messages(target_audience);
CREATE INDEX IF NOT EXISTS admin_messages_created_at_idx ON admin_messages(created_at DESC);

ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Admin: full access
DROP POLICY IF EXISTS "Admin messages: admin select" ON admin_messages;
CREATE POLICY "Admin messages: admin select"
ON admin_messages FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin messages: admin insert" ON admin_messages;
CREATE POLICY "Admin messages: admin insert"
ON admin_messages FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Sellers: read messages for them (target = sellers) – user must own at least one car
DROP POLICY IF EXISTS "Admin messages: sellers read" ON admin_messages;
CREATE POLICY "Admin messages: sellers read"
ON admin_messages FOR SELECT TO authenticated
USING (
  target_audience = 'sellers'
  AND EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = auth.uid())
);

-- Buyers: read messages for them (target = buyers) – user not admin, not a car owner
DROP POLICY IF EXISTS "Admin messages: buyers read" ON admin_messages;
CREATE POLICY "Admin messages: buyers read"
ON admin_messages FOR SELECT TO authenticated
USING (
  target_audience = 'buyers'
  AND NOT public.is_admin()
  AND NOT EXISTS (SELECT 1 FROM cars WHERE cars.owner_id = auth.uid())
);

-- 2. User notifications (e.g. discount alerts for favorited cars)
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'discount', 'admin_message', etc.
  car_id uuid REFERENCES cars(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS user_notifications_created_at_idx ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS user_notifications_read_at_idx ON user_notifications(read_at) WHERE read_at IS NULL;

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User notifications: own only" ON user_notifications;
CREATE POLICY "User notifications: own only"
ON user_notifications FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Function: notify favoriters when seller adds discount (call from app after car update)
CREATE OR REPLACE FUNCTION public.notify_favoriters_discount(
  p_car_id uuid,
  p_car_title text,
  p_discount_percent numeric
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_user_id uuid;
  v_count integer := 0;
BEGIN
  SELECT owner_id INTO v_owner_id FROM cars WHERE id = p_car_id;
  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR v_user_id IN
    SELECT DISTINCT user_id FROM favorites WHERE car_id = p_car_id AND user_id IS NOT NULL
  LOOP
    INSERT INTO user_notifications (user_id, type, car_id, title, body)
    VALUES (
      v_user_id,
      'discount',
      p_car_id,
      p_discount_percent || '% off: ' || coalesce(p_car_title, 'Car'),
      'A seller applied a ' || p_discount_percent || '% discount to a car in your favorites.'
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
