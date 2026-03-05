-- ============================================================
-- FIX: "new row violates row-level security policy" on image upload
-- Run this ENTIRE script in Supabase → SQL Editor
-- ============================================================
-- 1. Create bucket if needed: Storage → New bucket → "car-images" → Public: ON
-- 2. This uses permissive policies (any authenticated user can upload to car-images)
-- ============================================================

-- Remove ALL existing car-images policies (avoids conflicts from multiple migrations)
DROP POLICY IF EXISTS "car-images: auth insert own" ON storage.objects;
DROP POLICY IF EXISTS "car-images: auth update own" ON storage.objects;
DROP POLICY IF EXISTS "car-images: auth upload own" ON storage.objects;
DROP POLICY IF EXISTS "car-images: public select" ON storage.objects;
DROP POLICY IF EXISTS "car-images: public read" ON storage.objects;
DROP POLICY IF EXISTS "car-images: authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "car-images: authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "car-images: authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "car-images: allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "car-images: allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload car images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read for car images" ON storage.objects;
DROP POLICY IF EXISTS "Public read car images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own car images" ON storage.objects;

-- INSERT: any authenticated user can upload to car-images
CREATE POLICY "car-images insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-images');

-- UPDATE: needed for overwrite/upsert
CREATE POLICY "car-images update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-images')
WITH CHECK (bucket_id = 'car-images');

-- SELECT: public read (so images display on site)
CREATE POLICY "car-images select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

-- DELETE: authenticated users can delete in car-images
CREATE POLICY "car-images delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images');
