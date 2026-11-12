import type { Metadata } from "next";
import { cache } from "react";
import { preload } from "react-dom";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { SITE_URL } from "@/lib/constants";
import { getCarImageUrl, GALLERY_HERO_WIDTH } from "@/lib/image-utils";
import { seoSocialImages } from "@/lib/seo-og";
import CarProductJsonLd from "@/app/components/CarProductJsonLd";
import CarDetailSkeleton from "@/app/components/CarDetailSkeleton";
import CarDetailClient, { type CarDetailInitial } from "./CarDetailClient";

export const revalidate = 60;

const CAR_DETAIL_SELECT =
  "id, title, description, price, make, model, year, mileage, type, province, city, country, images, currency, condition, discount_percent, transmission, fuel_type, owner_id, created_at, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_min_hours, rental_event_type, features, is_sold";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
};

/** Shared between metadata + page so we don't hit Supabase twice per request. */
const fetchApprovedCar = cache(async (id: string): Promise<CarDetailInitial | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cars")
    .select(CAR_DETAIL_SELECT)
    .eq("id", id)
    .eq("is_approved", true)
    .eq("is_draft", false)
    .maybeSingle();
  return (data as CarDetailInitial | null) ?? null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchApprovedCar(id);

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
  const images = seoSocialImages(image, title);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => (typeof i === "string" ? i : String(i.url))),
    },
  };
}

export default async function CarDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === "1";
  const initialCar = isPreview ? null : await fetchApprovedCar(id);

  const firstImage =
    initialCar && Array.isArray(initialCar.images) && initialCar.images[0]
      ? initialCar.images[0]
      : null;
  if (firstImage) {
    const lcpSrc =
      getCarImageUrl(firstImage, { width: GALLERY_HERO_WIDTH, quality: 72 }) ?? firstImage;
    preload(lcpSrc, { as: "image", fetchPriority: "high" });
  }

  return (
    <>
      {initialCar && <CarProductJsonLd car={initialCar} />}
      <Suspense fallback={<CarDetailSkeleton />}>
        <CarDetailClient initialCar={initialCar} />
      </Suspense>
    </>
  );
}
