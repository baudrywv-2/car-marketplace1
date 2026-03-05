-- ============================================================
-- FIX: "new row violates row-level security policy" on image upload
-- Run this in Supabase → SQL Editor
-- ============================================================
-- Prerequisites:
-- 1. Dashboard → Storage → New bucket → Name: "car-images", Public: ON
-- 2. Ensure the user is logged in when uploading
-- 3. If still failing, run the FALLBACK block at the bottom (less secure)
-- ============================================================

-- Drop ALL possible storage policies (from various migrations)
DROP POLICY IF EXISTS "car-images: auth insert own" ON storage.objects;
DROP POLICY IF EXISTS "car-images: auth update own" ON storage.objects;
DROP POLICY IF EXISTS "car-images: auth upload own" ON storage.objects;
DROP POLICY IF EXISTS "car-images: public select" ON storage.objects;
DROP POLICY IF EXISTS "car-images: public read" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload car images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read for car images" ON storage.objects;
DROP POLICY IF EXISTS "Public read car images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own car images" ON storage.objects;

-- INSERT: authenticated users upload to users/{user_id}/...
-- Path format in ImageUpload: users/${user.id}/${timestamp}-${i}.${ext}
-- Using auth.jwt()->>'sub' per Supabase docs (same as auth.uid())
CREATE POLICY "car-images: authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);

-- UPDATE: required for upsert (overwrite existing file)
CREATE POLICY "car-images: authenticated update"
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

-- SELECT: required for upsert + public viewing of images
CREATE POLICY "car-images: public select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

-- DELETE: allow users to remove their own uploads
CREATE POLICY "car-images: authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);

-- ============================================================
-- FALLBACK: If uploads still fail, run ONLY this block below.
-- It allows any authenticated user to upload anywhere in car-images.
-- Remove the 4 policies above first, then run this:
-- ============================================================
/*
DROP POLICY IF EXISTS "car-images: authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "car-images: authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "car-images: authenticated delete" ON storage.objects;

CREATE POLICY "car-images: allow authenticated insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "car-images: allow authenticated update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'car-images')
WITH CHECK (bucket_id = 'car-images');
*/
