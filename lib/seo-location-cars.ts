import { createClient } from "@/lib/supabase-server";
import type { SeoLocation } from "@/lib/seo-locations";

export type SeoSampleCar = {
  id: string;
  title: string;
  price: number;
  currency: string | null;
  city: string | null;
  province: string | null;
};

export async function fetchSeoSampleCars(location: SeoLocation, limit = 8): Promise<SeoSampleCar[]> {
  try {
    const supabase = await createClient();
    const base = () =>
      supabase
        .from("cars")
        .select("id, title, price, currency, city, province")
        .eq("is_approved", true)
        .eq("is_draft", false)
        .or("listing_type.eq.sale,listing_type.eq.both")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (location.kind === "national") {
      const { data } = await base();
      return (data ?? []) as SeoSampleCar[];
    }

    if (location.kind === "province") {
      const { data } = await base().eq("province", location.name);
      return (data ?? []) as SeoSampleCar[];
    }

    const [{ data: byProvince }, { data: byCity }] = await Promise.all([
      base().eq("province", location.name),
      base().ilike("city", `%${location.name}%`),
    ]);

    const map = new Map<string, SeoSampleCar>();
    for (const row of [...(byProvince ?? []), ...(byCity ?? [])]) {
      map.set(row.id, row as SeoSampleCar);
    }
    return [...map.values()].slice(0, limit);
  } catch {
    return [];
  }
}
