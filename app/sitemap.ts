import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/constants";
import { allSeoLocationSlugs } from "@/lib/seo-locations";
import { allSeoPhraseSlugs } from "@/lib/seo-phrases";
import { allSeoRentEventSlugs } from "@/lib/seo-rent";

const top = (slug: string) =>
  slug === "rdc" || slug === "goma" || slug === "kinshasa" || slug === "lubumbashi";

const seoLocationPages: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}/voitures-a-vendre`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    url: `${SITE_URL}/acheter-voiture`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    url: `${SITE_URL}/location-voiture`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/guides/acheter-voiture-rdc`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/guides/vendre-voiture-rdc`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/guides/location-voiture-evenement`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  ...allSeoLocationSlugs().flatMap((slug) => [
    {
      url: `${SITE_URL}/voitures-a-vendre/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: top(slug) ? 0.9 : 0.75,
    },
    {
      url: `${SITE_URL}/acheter-voiture/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: top(slug) ? 0.9 : 0.75,
    },
    {
      url: `${SITE_URL}/voiture/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: top(slug) ? 0.92 : 0.78,
    },
    {
      url: `${SITE_URL}/location-voiture/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: top(slug) ? 0.9 : 0.76,
    },
  ]),
  ...allSeoRentEventSlugs().map((event) => ({
    url: `${SITE_URL}/location-voiture/pour/${event}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.88,
  })),
  ...allSeoPhraseSlugs().map((slug) => ({
    url: `${SITE_URL}/annonces/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.88,
  })),
];

const staticPages: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  { url: `${SITE_URL}/cars`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE_URL}/rent`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/favorites`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  { url: `${SITE_URL}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/site-map`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/disclaimer`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ...seoLocationPages,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return staticPages;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: cars } = await supabase
      .from("cars")
      .select("id, created_at")
      .eq("is_approved", true)
      .eq("is_draft", false)
      .or("is_sold.eq.false,is_sold.is.null");

    const carPages: MetadataRoute.Sitemap = (cars ?? []).map((c) => ({
      url: `${SITE_URL}/cars/${c.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...carPages];
  } catch {
    return staticPages;
  }
}
