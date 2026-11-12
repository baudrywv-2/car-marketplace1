import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { SEO_CITIES } from "@/lib/seo-locations";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";
import { SEO_RENT_EVENTS } from "@/lib/seo-rent";

const TITLE = "Location voiture & véhicule RDC | Mariage voyage tourisme ONG — DRCCARS";
const DESCRIPTION =
  "Voiture de location pour tout événement en RDC : mariages, voyage, tourisme, ONG, entreprises, aéroport. Par ville — Kinshasa, Goma, Lubumbashi.";
const OG_IMAGES = seoSocialImages(null, TITLE);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "location voiture RDC",
    "véhicule de location",
    "voiture de location pour tout événement",
    "location voiture mariage",
    "location voiture voyage",
    "location voiture tourisme",
    "location véhicule ONG",
  ],
  alternates: { canonical: `${SITE_URL}/location-voiture` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/location-voiture`,
    type: "website",
    images: OG_IMAGES,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: seoTwitterImages(OG_IMAGES),
  },
};

export default function LocationVoitureHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Location voiture & véhicule en RDC
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Louez une <strong className="text-[var(--foreground)]">voiture de location</strong> ou un{" "}
        <strong className="text-[var(--foreground)]">véhicule</strong> pour{" "}
        <strong className="text-[var(--foreground)]">tout événement</strong> : mariages, voyage, tourisme, ONG,
        entreprises, transferts aéroport. Annonces locales sur DRCCARS.
      </p>
      <p className="mt-4 flex flex-wrap gap-3">
        <Link href="/rent" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Voir les locations
        </Link>
        <Link href="/location-voiture/rdc" className="btn-secondary inline-flex min-h-11 items-center px-5 text-[13px]">
          Toute la RDC
        </Link>
      </p>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Pour quel événement ?
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SEO_RENT_EVENTS.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/location-voiture/pour/${e.slug}`}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--foreground)] hover:border-[var(--accent)]/45"
              >
                {e.titleHint}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Location par ville
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {SEO_CITIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/location-voiture/${c.slug}`}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--foreground)] hover:border-[var(--accent)]/45"
              >
                Location voiture {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
