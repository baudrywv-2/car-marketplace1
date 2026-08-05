-- Listing quality: reject incomplete non-draft listings.
-- Run manually in Supabase SQL editor if migrations are not auto-applied.

CREATE OR REPLACE FUNCTION public.cars_enforce_listing_quality()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  allowed_types text[] := ARRAY[
    'Sedan', 'SUV', 'Hatchback', 'Van', 'Truck', 'Pick up', 'Wagon', 'Coupe',
    'Mini Van', 'Mini Bus', 'Bus', 'Convertible', 'Machinery', 'Other'
  ];
BEGIN
  IF NEW.is_draft IS TRUE THEN
    RETURN NEW;
  END IF;

  NEW.title := trim(regexp_replace(regexp_replace(coalesce(NEW.title, ''), '_', ' ', 'g'), '\s+', ' ', 'g'));
  NEW.make := trim(coalesce(NEW.make, ''));
  NEW.model := trim(regexp_replace(regexp_replace(coalesce(NEW.model, ''), '_', ' ', 'g'), '\s+', ' ', 'g'));
  NEW.type := nullif(trim(coalesce(NEW.type, '')), '');

  IF NEW.title IS NULL OR length(NEW.title) < 8 THEN
    RAISE EXCEPTION 'Listing title must be at least 8 characters when submitting for approval';
  END IF;
  IF length(NEW.title) > 120 THEN
    RAISE EXCEPTION 'Listing title must be 120 characters or fewer';
  END IF;
  IF NEW.make IS NULL OR length(NEW.make) < 1 OR lower(NEW.make) = 'other' THEN
    RAISE EXCEPTION 'Listing make is required when submitting for approval';
  END IF;
  IF NEW.model IS NULL OR length(NEW.model) < 2 THEN
    RAISE EXCEPTION 'Listing model is required when submitting for approval';
  END IF;
  IF NEW.type IS NULL OR NOT (NEW.type = ANY (allowed_types)) THEN
    RAISE EXCEPTION 'Listing vehicle type is required and must be a valid type when submitting for approval';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cars_enforce_listing_quality ON public.cars;
CREATE TRIGGER cars_enforce_listing_quality
  BEFORE INSERT OR UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.cars_enforce_listing_quality();
