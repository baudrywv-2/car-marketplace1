import { cache } from "react";
import { createClient } from "@/lib/supabase-server";
import type { SeoLocation } from "@/lib/seo-locations";

export type SeoSampleCar = {
  id: string;
  title: string;
  price: number;
  currency: string | null;
  city: string | null;
  province: string | null;
  /** First listing photo URL when available */
  image: string | null;
};

type CarRow = {
  id: string;
  title: string;
  price: number;
  currency: string | null;
  city: string | null;
  province: string | null;
  images: unknown;
};

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  return typeof first === "string" && first.length > 0 ? first : null;
}

function mapRow(row: CarRow): SeoSampleCar {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    currency: row.currency,
    city: row.city,
    province: row.province,
    image: firstImage(row.images),
  };
}

/**
 * Recent approved sale listings for a SEO location.
 * Cached per-request so generateMetadata + page share one fetch.
 */
export const fetchSeoSampleCars = cache(async function fetchSeoSampleCars(
  location: SeoLocation,
  limit = 8
): Promise<SeoSampleCar[]> {
  try {
    const supabase = await createClient();
    const base = () =>
      supabase
        .from("cars")
        .select("id, title, price, currency, city, province, images")
        .eq("is_approved", true)
        .eq("is_draft", false)
        .or("listing_type.eq.sale,listing_type.eq.both")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (location.kind === "national") {
      const { data } = await base();
      return ((data ?? []) as CarRow[]).map(mapRow);
    }

    if (location.kind === "province") {
      const { data } = await base().eq("province", location.name);
      return ((data ?? []) as CarRow[]).map(mapRow);
    }

    const [{ data: byProvince }, { data: byCity }] = await Promise.all([
      base().eq("province", location.name),
      base().ilike("city", `%${location.name}%`),
    ]);

    const map = new Map<string, SeoSampleCar>();
    for (const row of [...((byProvince ?? []) as CarRow[]), ...((byCity ?? []) as CarRow[])]) {
      map.set(row.id, mapRow(row));
    }
    return [...map.values()].slice(0, limit);
  } catch {
    return [];
  }
});
