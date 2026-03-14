-- Run this in Supabase SQL Editor to ensure RDV works end-to-end.
-- Safe to run multiple times.

-- 0. Ensure is_admin() exists (required for RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;

-- 1. Ensure rendezvous_requests exists with all columns
CREATE TABLE IF NOT EXISTS rendezvous_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_email text,
  buyer_name text,
  buyer_phone text,
  message text,
  preferred_date text,
  suggested_price numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS buyer_phone text;
ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS suggested_price numeric;

-- 2. RLS
ALTER TABLE rendezvous_requests ENABLE ROW LEVEL SECURITY;

-- Admin: select all
DROP POLICY IF EXISTS "Rdv: admin select all" ON rendezvous_requests;
CREATE POLICY "Rdv: admin select all" ON rendezvous_requests FOR SELECT TO authenticated
USING (public.is_admin());

-- Admin: update
DROP POLICY IF EXISTS "Rdv: admin update" ON rendezvous_requests;
CREATE POLICY "Rdv: admin update" ON rendezvous_requests FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin: delete
DROP POLICY IF EXISTS "Rdv: admin can delete" ON rendezvous_requests;
CREATE POLICY "Rdv: admin can delete" ON rendezvous_requests FOR DELETE TO authenticated
USING (public.is_admin());

-- Insert: any authenticated user
DROP POLICY IF EXISTS "Rdv: authenticated insert" ON rendezvous_requests;
CREATE POLICY "Rdv: authenticated insert" ON rendezvous_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = buyer_id);

-- Seller: see approved for own cars
DROP POLICY IF EXISTS "Rdv: seller sees approved for own cars" ON rendezvous_requests;
CREATE POLICY "Rdv: seller sees approved for own cars" ON rendezvous_requests FOR SELECT TO authenticated
USING (status = 'approved' AND EXISTS (SELECT 1 FROM cars WHERE cars.id = rendezvous_requests.car_id AND cars.owner_id = auth.uid()));

-- Buyer: see own
DROP POLICY IF EXISTS "Rdv: buyer sees own" ON rendezvous_requests;
CREATE POLICY "Rdv: buyer sees own" ON rendezvous_requests FOR SELECT TO authenticated
USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Rdv: buyer can delete own" ON rendezvous_requests;
CREATE POLICY "Rdv: buyer can delete own" ON rendezvous_requests FOR DELETE TO authenticated
USING (buyer_id = auth.uid());
