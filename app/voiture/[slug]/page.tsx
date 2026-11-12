import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { fetchSeoSampleCars } from "@/lib/seo-location-cars";
import {
  SEO_CITIES,
  allSeoLocationSlugs,
  carsBrowseHref,
  getSeoLocation,
  locationAutofillPhrases,
  voitureShortDescription,
  voitureShortH1,
  voitureShortTitle,
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
  const title = voitureShortTitle(location);
  const description = voitureShortDescription(location);
  // Autofill alias — prefer the fuller vente landing as canonical to avoid
  // "Duplicate without user-selected canonical" clusters in GSC.
  const canonical = `${SITE_URL}/voitures-a-vendre/${location.slug}`;
  return {
    title: { absolute: title },
    description,
    keywords: locationAutofillPhrases(location),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

/** Short autofill URLs: /voiture/goma → "Voiture Goma" */
export default async function VoitureShortPage({ params }: Props) {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) notFound();

  const sampleCars = await fetchSeoSampleCars(location);
  const browse = carsBrowseHref(location);
  const phrases = locationAutofillPhrases(location);
  const related = SEO_CITIES.filter((c) => c.slug !== location.slug).slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <nav className="mb-6 flex flex-wrap gap-1 text-[11px] text-[var(--muted-foreground)]">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">Voiture {location.name}</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {voitureShortH1(location)}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Annonces <strong className="text-[var(--foreground)]">voiture {location.name}</strong>,{" "}
        <strong className="text-[var(--foreground)]">voiture à vendre {location.name}</strong> et{" "}
        <strong className="text-[var(--foreground)]">voiture d&apos;occasion</strong>. Achetez ou vendez via
        DRCCARS.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={browse} className="btn-primary min-h-11 px-5 text-[13px]">
          Voir voiture {location.name}
        </Link>
        <Link href={`/voitures-a-vendre/${location.slug}`} className="btn-secondary min-h-11 px-5 text-[13px]">
          Voitures à vendre
        </Link>
        <Link href={`/acheter-voiture/${location.slug}`} className="btn-ghost min-h-11 px-3 text-[12px]">
          Acheter voiture {location.name}
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Recherches fréquentes
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {phrases.map((p) => (
            <li
              key={p}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)]"
            >
              {p}
            </li>
          ))}
        </ul>
      </section>

      {sampleCars.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Annonces voiture {location.name}
          </h2>
          <ul className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
            {sampleCars.map((car) => (
              <li key={car.id}>
                <Link
                  href={`/cars/${car.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-[13px] hover:bg-[var(--border)]/30"
                >
                  <span className="font-medium text-[var(--foreground)]">{car.title}</span>
                  <span className="font-mono text-[var(--accent)]">
                    {car.currency === "CDF" ? "FC" : "$"}
                    {Number(car.price).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Autres villes — voiture…
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {related.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/voiture/${c.slug}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
              >
                Voiture {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
