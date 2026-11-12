import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import { SEO_CITIES, allSeoLocationSlugs, getSeoLocation } from "@/lib/seo-locations";
import { seoSocialImages } from "@/lib/seo-og";
import {
  SEO_RENT_EVENTS,
  rentBrowseHref,
  rentLocationDescription,
  rentLocationH1,
  rentLocationKeywords,
  rentLocationTitle,
} from "@/lib/seo-rent";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSeoLocationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) return {};
  const title = rentLocationTitle(location);
  const description = rentLocationDescription(location);
  const canonical = `${SITE_URL}/location-voiture/${location.slug}`;
  const images = seoSocialImages(null, title);
  return {
    title: { absolute: title },
    description,
    keywords: rentLocationKeywords(location),
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", images },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => (typeof i === "string" ? i : String(i.url))),
    },
  };
}

export default async function LocationVoitureCityPage({ params }: Props) {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) notFound();

  const browse = rentBrowseHref(location);
  const related = SEO_CITIES.filter((c) => c.slug !== location.slug).slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <nav className="mb-6 flex flex-wrap gap-1 text-[11px] text-[var(--muted-foreground)]">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/location-voiture" className="hover:underline">
          Location voiture
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{location.name}</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {rentLocationH1(location)}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Louez une <strong className="text-[var(--foreground)]">voiture</strong> ou un{" "}
        <strong className="text-[var(--foreground)]">véhicule de location</strong> à{" "}
        <strong className="text-[var(--foreground)]">{location.name}</strong> pour{" "}
        <strong className="text-[var(--foreground)]">tout événement</strong> : mariages, voyage, tourisme, ONG,
        entreprises, aéroport.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={browse} className="btn-primary min-h-11 px-5 text-[13px]">
          Voir les locations
        </Link>
        <Link href="/dashboard/cars/new" className="btn-secondary min-h-11 px-5 text-[13px]">
          Proposer ma voiture en location
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Location {location.name} par besoin
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_RENT_EVENTS.map((e) => (
            <li key={e.slug}>
              <Link
                href={rentBrowseHref(location, e)}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
              >
                {e.nameFr}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-[var(--muted-foreground)]">
          Pages nationales :{" "}
          {SEO_RENT_EVENTS.slice(0, 4).map((e, i) => (
            <span key={e.slug}>
              {i > 0 ? " · " : null}
              <Link href={`/location-voiture/pour/${e.slug}`} className="text-[var(--accent)] hover:underline">
                {e.nameFr}
              </Link>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Autres villes
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {related.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/location-voiture/${c.slug}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
              >
                Location {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
