import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoModelLanding from "@/app/components/SeoModelLanding";
import { SITE_URL } from "@/lib/constants";
import { fetchSeoModelSampleCars } from "@/lib/seo-location-cars";
import { firstSampleImage, seoSocialImages, seoTwitterImages } from "@/lib/seo-og";
import {
  allSeoModelCityParams,
  getSeoCarModel,
  resolveSeoModelLocation,
  seoModelDescription,
  seoModelKeywords,
  seoModelPath,
  seoModelTitle,
} from "@/lib/seo-models";

export const revalidate = 600;

type Props = { params: Promise<{ make: string; model: string; city: string }> };

export function generateStaticParams() {
  return allSeoModelCityParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make, model: modelSlug, city } = await params;
  const carModel = getSeoCarModel(make, modelSlug);
  const location = resolveSeoModelLocation(city);
  if (!carModel || !location) return {};
  const title = seoModelTitle(carModel, location);
  const description = seoModelDescription(carModel, location);
  const canonical = `${SITE_URL}${seoModelPath(carModel, city)}`;
  const samples = await fetchSeoModelSampleCars(carModel, location);
  const images = seoSocialImages(firstSampleImage(samples), title);
  return {
    title: { absolute: title },
    description,
    keywords: seoModelKeywords(carModel, location),
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", images },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: seoTwitterImages(images),
    },
  };
}

export default async function SeoModelCityPage({ params }: Props) {
  const { make, model: modelSlug, city } = await params;
  const carModel = getSeoCarModel(make, modelSlug);
  const location = resolveSeoModelLocation(city);
  if (!carModel || !location) notFound();
  const sampleCars = await fetchSeoModelSampleCars(carModel, location);
  return <SeoModelLanding model={carModel} location={location} sampleCars={sampleCars} />;
}
