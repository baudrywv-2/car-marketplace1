-- FALLBACK: Use this ONLY if fix-storage-rls-complete.sql still gives RLS errors.
-- This allows any authenticated user to upload anywhere in car-images (less secure).
-- Run in Supabase → SQL Editor

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
