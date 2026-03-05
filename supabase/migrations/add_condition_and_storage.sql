-- Run this in Supabase → SQL Editor to fix:
-- 1. "Could not find the 'condition' column of 'cars' in the schema cache"
-- 2. "Row-level security policy on image upload" (car-images bucket)

-- 1. Add condition column to cars (used/new)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS "condition" text DEFAULT 'used' CHECK ("condition" IN ('new', 'used'));

-- 2. Storage policies for car-images bucket
-- First ensure the bucket exists: Supabase Dashboard → Storage → New bucket → name: car-images, Public: ON

-- Allow authenticated users to upload to their own folder (users/{user_id}/*)
DROP POLICY IF EXISTS "Users can upload car images to own folder" ON storage.objects;
CREATE POLICY "Users can upload car images to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read for displaying images
DROP POLICY IF EXISTS "Public read for car images" ON storage.objects;
CREATE POLICY "Public read for car images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');
