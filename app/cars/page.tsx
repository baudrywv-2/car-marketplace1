import { createClient } from "@/lib/supabase-server";
import {
  applyCarFilters,
  filtersFromSearchParams,
  type CarSearchFilters,
} from "@/lib/car-search-query";
import CarsPageClient from "./CarsPageClient";

export const revalidate = 60;

const CARS_FETCH_LIMIT = 60;

const CAR_LIST_SELECT =
  "id, title, price, make, model, year, type, province, city, images, currency, condition, discount_percent, transmission, fuel_type, mileage, owner_id, created_at, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_event_type, is_sold, boost_score";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function spGet(raw: Record<string, string | string[] | undefined>, key: string): string | null {
  const v = raw[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export default async function CarsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const filters: CarSearchFilters = filtersFromSearchParams({
    get: (key) => spGet(raw, key),
  });

  const supabase = await createClient();
  let query = supabase
    .from("cars")
    .select(CAR_LIST_SELECT)
    .eq("is_approved", true)
    .eq("is_draft", false);

  query = applyCarFilters(query, filters);

  const { data: carsData } = await query
    .order("boost_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(CARS_FETCH_LIMIT);

  const cars = carsData ?? [];
  const ownerIds = [
    ...new Set(
      cars
        .map((c) => (c as { owner_id?: string }).owner_id)
        .filter(Boolean)
    ),
  ] as string[];

  let profiles: Record<
    string,
    {
      id: string;
      full_name: string | null;
      phone_verified?: boolean;
      id_verified?: boolean;
      dealer_verified?: boolean;
    }
  > = {};

  if (ownerIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, phone_verified, id_verified, dealer_verified")
      .in("id", ownerIds);
    (profilesData ?? []).forEach((p) => {
      profiles[p.id] = p;
    });
  }

  return (
    <CarsPageClient
      initialCars={cars as never}
      initialProfiles={profiles}
    />
  );
}
