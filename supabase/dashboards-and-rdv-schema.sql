-- Dashboards & Rendez-vous flow
-- Run in Supabase → SQL Editor
--
-- Adds: company_name (seller brand), buyer contact fields, status on RDV
-- RLS: Admin sees all RDV; Seller sees only approved RDV for their cars; Buyer sees own RDV

-- 1. Profiles: add company_name (seller brand)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;

-- 2. Profiles: allow UPDATE for own profile (for company_name, phone, whatsapp)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Rendezvous_requests: ensure table exists and add columns
-- (If table doesn't exist, create it - adjust as needed for your schema)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rendezvous_requests') THEN
    CREATE TABLE rendezvous_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      buyer_email text,
      buyer_name text,
      buyer_phone text,
      message text,
      preferred_date text,
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS buyer_phone text;
ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Ensure status constraint
ALTER TABLE rendezvous_requests DROP CONSTRAINT IF EXISTS rendezvous_requests_status_check;
ALTER TABLE rendezvous_requests ADD CONSTRAINT rendezvous_requests_status_check CHECK (status IN ('pending', 'approved'));

CREATE INDEX IF NOT EXISTS rendezvous_requests_car_id_idx ON rendezvous_requests(car_id);
CREATE INDEX IF NOT EXISTS rendezvous_requests_buyer_id_idx ON rendezvous_requests(buyer_id);
CREATE INDEX IF NOT EXISTS rendezvous_requests_status_idx ON rendezvous_requests(status);

ALTER TABLE rendezvous_requests ENABLE ROW LEVEL SECURITY;

-- Admin: select all RDV (ensure is_admin exists - from fix-admin-dashboard.sql)
-- DROP POLICY IF EXISTS "Rdv: admin can read all" ON rendezvous_requests;
DROP POLICY IF EXISTS "Rdv: admin select all" ON rendezvous_requests;
CREATE POLICY "Rdv: admin select all"
ON rendezvous_requests FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admin: update (approve) RDV
DROP POLICY IF EXISTS "Rdv: admin can update" ON rendezvous_requests;
CREATE POLICY "Rdv: admin update"
ON rendezvous_requests FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Any authenticated: insert (buyer submits request)
DROP POLICY IF EXISTS "Rdv: authenticated insert" ON rendezvous_requests;
CREATE POLICY "Rdv: authenticated insert"
ON rendezvous_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- Seller: select approved RDV for their own cars only
DROP POLICY IF EXISTS "Rdv: seller sees approved for own cars" ON rendezvous_requests;
CREATE POLICY "Rdv: seller sees approved for own cars"
ON rendezvous_requests FOR SELECT
TO authenticated
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1 FROM cars
    WHERE cars.id = rendezvous_requests.car_id
    AND cars.owner_id = auth.uid()
  )
);

-- Buyer: select own RDV (to see status of their requests)
DROP POLICY IF EXISTS "Rdv: buyer sees own" ON rendezvous_requests;
CREATE POLICY "Rdv: buyer sees own"
ON rendezvous_requests FOR SELECT
TO authenticated
USING (buyer_id = auth.uid());
