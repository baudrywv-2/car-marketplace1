-- Add weekly and monthly rental pricing tiers
-- Run in Supabase → SQL Editor

ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_price_per_week numeric(10,2);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_price_per_month numeric(10,2);
