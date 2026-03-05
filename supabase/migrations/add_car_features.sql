-- Add optional features array to cars (e.g. A/C, ABS, Sun Roof, Navigation)
-- Run in Supabase → SQL Editor

ALTER TABLE cars ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}';

COMMENT ON COLUMN cars.features IS 'Array of feature IDs from CAR_FEATURES (e.g. ac, abs, sun_roof, navigation)';
