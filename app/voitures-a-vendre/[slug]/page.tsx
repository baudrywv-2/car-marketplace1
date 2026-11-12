import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLocationLanding from "@/app/components/SeoLocationLanding";
import { SITE_URL } from "@/lib/constants";
import { fetchSeoSampleCars } from "@/lib/seo-location-cars";
import { firstSampleImage, seoSocialImages, seoTwitterImages } from "@/lib/seo-og";
import {
  allSeoLocationSlugs,
  getSeoLocation,
  locationAutofillPhrases,
  venteDescription,
  venteTitle,
} from "@/lib/seo-locations";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSeoLocationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) return {};
  const title = venteTitle(location);
  const description = venteDescription(location);
  const canonical = `${SITE_URL}/voitures-a-vendre/${location.slug}`;
  const sampleCars = await fetchSeoSampleCars(location);
  const images = seoSocialImages(firstSampleImage(sampleCars), title);
  return {
    title: { absolute: title },
    description,
    keywords: locationAutofillPhrases(location),
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: seoTwitterImages(images) },
  };
}

export default async function VoituresAVendreSlugPage({ params }: Props) {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) notFound();
  const sampleCars = await fetchSeoSampleCars(location);
  return <SeoLocationLanding location={location} intent="vente" sampleCars={sampleCars} />;
}
