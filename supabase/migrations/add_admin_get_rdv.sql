-- Admin RDV: RPC to fetch all rendez-vous requests (bypasses RLS)
-- Ensures admin always sees RDV even if RLS or is_admin() has edge cases

CREATE OR REPLACE FUNCTION public.admin_get_rdv()
RETURNS TABLE (
  id uuid,
  car_id uuid,
  message text,
  preferred_date text,
  suggested_price numeric,
  status text,
  created_at timestamptz,
  buyer_email text,
  buyer_name text,
  buyer_phone text,
  buyer_id uuid,
  car_title text,
  car_owner_id uuid,
  car_owner_phone text,
  car_owner_whatsapp text,
  car_owner_address text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    r.id,
    r.car_id,
    r.message,
    r.preferred_date,
    r.suggested_price,
    r.status,
    r.created_at,
    r.buyer_email,
    r.buyer_name,
    r.buyer_phone,
    r.buyer_id,
    c.title AS car_title,
    c.owner_id AS car_owner_id,
    c.owner_phone AS car_owner_phone,
    c.owner_whatsapp AS car_owner_whatsapp,
    c.owner_address AS car_owner_address
  FROM public.rendezvous_requests r
  LEFT JOIN public.cars c ON c.id = r.car_id
  WHERE public.is_admin()
  ORDER BY r.created_at DESC;
$$;
