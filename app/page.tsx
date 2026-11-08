import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { SITE_URL } from "@/lib/constants";
import HomePage, { type HomeFeaturedCar } from "./components/HomePage";
import HomeSeoBlock from "./components/HomeSeoBlock";

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute:
      "DRCCARS | Voitures à vendre en RDC — Goma, Kinshasa, Lubumbashi | Occasion & location",
  },
  description:
    "Marketplace auto n°1 à viser en RDC : voiture Goma, voiture Kinshasa, véhicule à vendre, location mariage voyage ONG. Annonces locales sur DRCCARS — mieux qu’un simple catalogue dealer.",
  alternates: { canonical: SITE_URL },
};

async function loadHomeData(): Promise<{
  featured: HomeFeaturedCar[];
  makeCounts: { name: string; count: number }[];
}> {
  try {
    const supabase = await createClient();
    const [{ data: featuredData }, { data: metaData }] = await Promise.all([
      supabase
        .from("cars")
        .select(
          "id, title, price, make, model, year, condition, currency, images, is_sold, listing_type, discount_percent, province, city, mileage, fuel_type, transmission, boost_score, created_at"
        )
        .eq("is_approved", true)
        .eq("is_draft", false)
        .eq("is_sold", false)
        .order("boost_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("cars")
        .select("make")
        .eq("is_approved", true)
        .eq("is_draft", false)
        .eq("is_sold", false)
        .limit(250),
    ]);

    const counts: Record<string, number> = {};
    for (const row of (metaData ?? []) as { make: string | null }[]) {
      const m = row.make?.trim();
      if (m) counts[m] = (counts[m] ?? 0) + 1;
    }
    const makeCounts = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      featured: (featuredData ?? []) as HomeFeaturedCar[],
      makeCounts,
    };
  } catch {
    return { featured: [], makeCounts: [] };
  }
}

export default async function Page() {
  const { featured, makeCounts } = await loadHomeData();
  return (
    <>
      <HomePage initialFeatured={featured} initialMakeCounts={makeCounts} />
      <HomeSeoBlock />
    </>
  );
}
