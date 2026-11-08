import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLocationLanding from "@/app/components/SeoLocationLanding";
import { SITE_URL } from "@/lib/constants";
import { fetchSeoSampleCars } from "@/lib/seo-location-cars";
import {
  acheterDescription,
  acheterTitle,
  allSeoLocationSlugs,
  getSeoLocation,
  locationAutofillPhrases,
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
  const title = acheterTitle(location);
  const description = acheterDescription(location);
  const canonical = `${SITE_URL}/acheter-voiture/${location.slug}`;
  return {
    title: { absolute: title },
    description,
    keywords: locationAutofillPhrases(location),
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default async function AcheterVoitureSlugPage({ params }: Props) {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) notFound();
  const sampleCars = await fetchSeoSampleCars(location);
  return <SeoLocationLanding location={location} intent="acheter" sampleCars={sampleCars} />;
}
