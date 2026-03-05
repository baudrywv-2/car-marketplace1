-- Rejection reason for unapproved listings
-- Run in Supabase → SQL Editor

ALTER TABLE cars ADD COLUMN IF NOT EXISTS rejection_reason text;
