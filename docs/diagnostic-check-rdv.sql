-- Run this in Supabase SQL Editor to verify RDV data
-- If this returns rows, data exists and the issue is with the API/RLS

SELECT id, car_id, buyer_email, buyer_name, status, created_at
FROM rendezvous_requests
ORDER BY created_at DESC
LIMIT 20;
