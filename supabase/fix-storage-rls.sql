-- Fix "new row violates row-level security policy" on image upload
-- Run in Supabase → SQL Editor
-- Path used by app: users/{user_id}/filename.jpg | Upsert needs INSERT + SELECT + UPDATE

DROP POLICY IF EXISTS "car-images: auth upload own" ON storage.objects;
DROP POLICY IF EXISTS "car-images: auth insert own" ON storage.objects;
CREATE POLICY "car-images: auth insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = (auth.jwt()->>'sub')
);

DROP POLICY IF EXISTS "car-images: auth update own" ON storage.objects;
CREATE POLICY "car-images: auth update own"
ON storage.objects FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "car-images: public read" ON storage.objects;
DROP POLICY IF EXISTS "car-images: public select" ON storage.objects;
CREATE POLICY "car-images: public select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'car-images');
