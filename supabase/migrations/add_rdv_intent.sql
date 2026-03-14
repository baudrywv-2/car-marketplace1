-- Add intent column to indicate if RDV is for buying (sale) or renting
ALTER TABLE rendezvous_requests ADD COLUMN IF NOT EXISTS intent text CHECK (intent IN ('sale', 'rent'));
COMMENT ON COLUMN rendezvous_requests.intent IS 'Buyer intent: sale = buying, rent = renting';
