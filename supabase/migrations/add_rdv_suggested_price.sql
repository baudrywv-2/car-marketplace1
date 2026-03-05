-- Add optional suggested price to rendez-vous (buyer indicates price willing to pay if car is in good condition)
ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS suggested_price numeric;
COMMENT ON COLUMN rendezvous_requests.suggested_price IS 'Price the buyer is willing to pay if the car is in good condition (optional).';
