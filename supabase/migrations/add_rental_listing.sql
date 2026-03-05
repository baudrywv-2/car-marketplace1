-- Rental listings: listing_type, rental pricing, event categories
-- Run in Supabase → SQL Editor
-- Keeps existing buy/sell flow intact; adds rent as optional mode

-- 1. Listing type: 'sale' | 'rent' | 'both'
ALTER TABLE cars ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'sale'
  CHECK (listing_type IS NULL OR listing_type IN ('sale', 'rent', 'both'));

-- 2. Rental pricing (used when listing_type IN ('rent', 'both'))
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_price_per_hour numeric(10,2);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_price_per_day numeric(10,2);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_currency text DEFAULT 'USD';
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_min_hours integer;

-- 3. Event category for rentals (weddings, tourism, corporate, airport, private)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_event_type text[]
  CHECK (
    rental_event_type IS NULL
    OR rental_event_type <@ ARRAY['wedding', 'tourism', 'corporate', 'airport', 'private']::text[]
  );

-- Index for rent page filtering
CREATE INDEX IF NOT EXISTS cars_listing_type_idx ON cars(listing_type) WHERE listing_type IN ('rent', 'both');
CREATE INDEX IF NOT EXISTS cars_rental_event_type_gin_idx ON cars USING GIN(rental_event_type) WHERE rental_event_type IS NOT NULL AND array_length(rental_event_type, 1) > 0;
