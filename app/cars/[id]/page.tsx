import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { SITE_URL } from "@/lib/constants";
import CarProductJsonLd from "@/app/components/CarProductJsonLd";
import LoadingFallback from "@/app/components/LoadingFallback";
import CarDetailClient, { type CarDetailInitial } from "./CarDetailClient";

export const revalidate = 60;

const CAR_DETAIL_SELECT =
  "id, title, description, price, make, model, year, mileage, type, province, city, country, images, currency, condition, discount_percent, transmission, fuel_type, owner_id, created_at, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_min_hours, rental_event_type, features, is_sold";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
};

async function fetchApprovedCar(id: string): Promise<CarDetailInitial | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cars")
    .select(CAR_DETAIL_SELECT)
    .eq("id", id)
    .eq("is_approved", true)
    .eq("is_draft", false)
    .maybeSingle();
  return (data as CarDetailInitial | null) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cars")
    .select("title, description, make, model, year, province, city, price, currency, images")
    .eq("id", id)
    .eq("is_approved", true)
    .eq("is_draft", false)
    .maybeSingle();

  if (!data) {
    return {
      title: "Car not found",
      description: "This car listing could not be found on DRCCARS.",
    };
  }

  const titleParts: string[] = [];
  if (data.year) titleParts.push(String(data.year));
  if (data.make) titleParts.push(data.make);
  if (data.model) titleParts.push(data.model);

  const location =
    [data.city, data.province].filter(Boolean).join(", ") || "Democratic Republic of Congo";

  const title =
    (titleParts.length ? `${titleParts.join(" ")} – ` : "") +
    `Car for sale in ${location}`;

  const description =
    data.description?.slice(0, 220) || `Car for sale in ${location} on DRCCARS.`;

  const image = Array.isArray(data.images) && data.images[0] ? data.images[0] : undefined;
  const canonical = `${SITE_URL}/cars/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function CarDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === "1";
  const initialCar = isPreview ? null : await fetchApprovedCar(id);

  return (
    <>
      {initialCar && <CarProductJsonLd car={initialCar} />}
      <Suspense fallback={<LoadingFallback />}>
        <CarDetailClient initialCar={initialCar} />
      </Suspense>
    </>
  );
}
