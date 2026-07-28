-- Safely extend signup → profiles sync (company_name, city, whatsapp).
-- Run in Supabase → SQL Editor. Idempotent.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, whatsapp, company_name, city)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'buyer'),
    NULLIF(new.raw_user_meta_data->>'phone', ''),
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'whatsapp', ''),
      NULLIF(new.raw_user_meta_data->>'phone', '')
    ),
    NULLIF(new.raw_user_meta_data->>'company_name', ''),
    NULLIF(new.raw_user_meta_data->>'city', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    whatsapp = COALESCE(EXCLUDED.whatsapp, profiles.whatsapp),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    city = COALESCE(EXCLUDED.city, profiles.city);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
