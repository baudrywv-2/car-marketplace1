-- Run this in Supabase → SQL Editor to fix:
-- 1. "Could not find the 'condition' column of 'cars'" 
-- 2. "new row violates row-level security policy on image upload"

-- ============================================
-- 1. Add missing columns to cars table
-- ============================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS condition text DEFAULT 'used' 
  CHECK (condition IS NULL OR condition IN ('new', 'used'));

ALTER TABLE cars ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS transmission text 
  CHECK (transmission IS NULL OR transmission IN ('automatic', 'manual'));
ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_type text 
  CHECK (fuel_type IS NULL OR fuel_type IN ('essence', 'diesel', 'electric', 'hybrid'));
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ============================================
-- 2. Storage: car-images bucket + RLS policies
-- ============================================
-- Create the bucket in Dashboard → Storage if it doesn't exist:
--   Name: car-images | Public: Yes

-- Drop existing policies if re-running (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can upload car images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read car images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own car images" ON storage.objects;

-- Allow authenticated users to upload to their own folder (users/{user_id}/...)
CREATE POLICY "Users can upload car images to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read of car images
CREATE POLICY "Public read car images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own car images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'car-images'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
