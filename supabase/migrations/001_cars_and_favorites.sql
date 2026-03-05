-- DRCCARS Schema Fix
-- Run this in Supabase → SQL Editor (one-time)
-- Fixes: condition, currency columns | favorites table | image upload RLS
--
-- Before running: Create bucket "car-images" in Storage (Dashboard → Storage → New bucket)

-- 1. Add missing columns to cars (if not exists)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS condition text DEFAULT 'used' CHECK (condition IN ('new', 'used'));
ALTER TABLE cars ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS transmission text CHECK (transmission IS NULL OR transmission IN ('automatic', 'manual'));
ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_type text CHECK (fuel_type IS NULL OR fuel_type IN ('essence', 'diesel', 'electric', 'hybrid'));

-- 2. Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, car_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_car_id_idx ON favorites(car_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

CREATE POLICY "Users can manage own favorites"
ON favorites FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Storage: car-images bucket policies (fix "row-level security policy on image upload")
-- Upsert needs INSERT + SELECT + UPDATE. Path: users/{user_id}/file.jpg

-- INSERT: authenticated users upload to users/{user_id}/
DROP POLICY IF EXISTS "car-images: auth insert own" ON storage.objects;
CREATE POLICY "car-images: auth insert own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);

-- UPDATE: for upsert (overwrite existing)
DROP POLICY IF EXISTS "car-images: auth update own" ON storage.objects;
CREATE POLICY "car-images: auth update own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = (auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);

-- SELECT: public read + needed for upsert
DROP POLICY IF EXISTS "car-images: public select" ON storage.objects;
CREATE POLICY "car-images: public select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');
