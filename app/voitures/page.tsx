import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { SEO_CAR_MODELS, SEO_MODEL_CITY_SLUGS, seoModelPath } from "@/lib/seo-models";
import { getSeoLocation } from "@/lib/seo-locations";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";

export const revalidate = 600;

const TITLE = "Toyota Prado, Hilux, Land Cruiser… à vendre en RDC — DRCCARS";
const DESCRIPTION =
  "Parcourez les modèles les plus demandés en RDC : Prado, Hilux, Land Cruiser, Noah, RAV4, Corolla — par ville sur DRCCARS.";
const images = seoSocialImages(null, TITLE);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/voitures` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/voitures`,
    type: "website",
    images,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: seoTwitterImages(images),
  },
};

export default function VoituresModelsHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Modèles populaires à vendre en RDC
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Pages dédiées aux véhicules les plus recherchés — comme sur les grandes marketplaces — avec annonces locales
        Kinshasa, Goma, Lubumbashi et Bukavu.
      </p>

      <ul className="mt-8 space-y-6">
        {SEO_CAR_MODELS.map((model) => (
          <li key={model.modelSlug} className="rounded-lg border border-[var(--border)] p-4">
            <h2 className="font-semibold text-[var(--foreground)]">
              {model.make} {model.modelLabel}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SEO_MODEL_CITY_SLUGS.map((slug) => {
                const loc = getSeoLocation(slug);
                if (!loc) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={seoModelPath(model, slug)}
                      className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
                    >
                      {loc.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-[12px] text-[var(--muted-foreground)]">
        Voir aussi{" "}
        <Link href="/voitures-a-vendre" className="text-[var(--accent)] hover:underline">
          voitures à vendre par ville
        </Link>
        {" · "}
        <Link href="/voitures-a-vendre/budget/sous-5000" className="text-[var(--accent)] hover:underline">
          budget sous 5 000 $
        </Link>
      </p>
    </div>
  );
}
