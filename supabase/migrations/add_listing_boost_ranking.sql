-- Admin-controlled ranking: listings with higher boost_score appear first in browse
-- Run in Supabase → SQL Editor

ALTER TABLE cars ADD COLUMN IF NOT EXISTS boost_score integer DEFAULT 0;
COMMENT ON COLUMN cars.boost_score IS 'Admin-set score for ranking. Higher = appears first in /cars. 0 = default order by created_at.';

-- Index for efficient ordering (boost_score desc, created_at desc)
CREATE INDEX IF NOT EXISTS cars_boost_created_idx ON cars (boost_score DESC NULLS LAST, created_at DESC);
