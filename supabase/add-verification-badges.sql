-- Verification badges for sellers
-- Run in Supabase → SQL Editor
--
-- Adds: phone_verified, id_verified, dealer_verified on profiles
-- "Verified Seller" badge shows when at least one is true

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dealer_verified boolean DEFAULT false;

-- Admin can update all profiles (for verification flags)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (true);

-- RPC for public to get seller verification (no PII) for approved cars
CREATE OR REPLACE FUNCTION get_seller_verification(p_car_id uuid)
RETURNS TABLE(phone_verified boolean, id_verified boolean, dealer_verified boolean)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT p.phone_verified, p.id_verified, p.dealer_verified
  FROM profiles p
  JOIN cars c ON c.owner_id = p.id
  WHERE c.id = p_car_id AND c.is_approved = true AND (c.is_draft = false OR c.is_draft IS NULL);
$$;

GRANT EXECUTE ON FUNCTION get_seller_verification(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_seller_verification(uuid) TO authenticated;
