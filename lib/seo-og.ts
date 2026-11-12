import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

/** Default social preview — always absolute for Google/Facebook crawlers. */
export const DEFAULT_OG_IMAGE_PATH = "/og-image.png";

export type SeoOgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function absoluteAssetUrl(url: string | null | undefined): string {
  if (!url) return `${SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/** Open Graph image list. Prefer a real listing photo when available. */
export function seoSocialImages(
  primaryImage?: string | null,
  alt = "DRCCARS – Voitures d'occasion en RDC"
): SeoOgImage[] {
  return [
    {
      url: absoluteAssetUrl(primaryImage),
      width: 1200,
      height: 630,
      alt,
    },
  ];
}

export function seoTwitterImages(images: SeoOgImage[]): string[] {
  return images.map((i) => i.url);
}

export function firstSampleImage(
  cars: { image?: string | null }[] | null | undefined
): string | null {
  if (!cars?.length) return null;
  for (const car of cars) {
    if (car.image) return car.image;
  }
  return null;
}

/** Convenience: OG + Twitter image fields for Metadata. */
export function seoSocialImageFields(
  primaryImage?: string | null,
  alt?: string
): Pick<NonNullable<Metadata["openGraph"]>, "images"> & {
  twitterImages: string[];
} {
  const images = seoSocialImages(primaryImage, alt);
  return { images, twitterImages: seoTwitterImages(images) };
}
