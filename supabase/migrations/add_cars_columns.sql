-- Run this in Supabase → SQL Editor to fix "column not found" errors
-- Adds condition, currency, and other columns expected by the app

-- Condition (new/used)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS condition text DEFAULT 'used' CHECK (condition IN ('new', 'used'));

-- Currency (USD/CDF)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Discount percentage (for Shop by Discount filter)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2);

-- Province and city (for location filters)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS country text;

-- Transmission and fuel
ALTER TABLE cars ADD COLUMN IF NOT EXISTS transmission text CHECK (transmission IS NULL OR transmission IN ('automatic', 'manual'));
ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_type text CHECK (fuel_type IS NULL OR fuel_type IN ('essence', 'diesel', 'electric', 'hybrid'));
