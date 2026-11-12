import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import { SEO_CITIES, SEO_NATIONAL } from "@/lib/seo-locations";
import { seoSocialImages } from "@/lib/seo-og";
import {
  allSeoRentEventSlugs,
  getSeoRentEvent,
  rentBrowseHref,
  rentEventDescription,
  rentEventH1,
  rentEventTitle,
} from "@/lib/seo-rent";

export const revalidate = 600;

type Props = { params: Promise<{ event: string }> };

export function generateStaticParams() {
  return allSeoRentEventSlugs().map((event) => ({ event }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { event: eventSlug } = await params;
  const event = getSeoRentEvent(eventSlug);
  if (!event) return {};
  const title = rentEventTitle(event);
  const description = rentEventDescription(event);
  const canonical = `${SITE_URL}/location-voiture/pour/${event.slug}`;
  const images = seoSocialImages(null, title);
  return {
    title: { absolute: title },
    description,
    keywords: event.keywords,
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

export default async function LocationVoitureEventPage({ params }: Props) {
  const { event: eventSlug } = await params;
  const event = getSeoRentEvent(eventSlug);
  if (!event) notFound();

  const browse = rentBrowseHref(SEO_NATIONAL, event);

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
        <span className="text-[var(--foreground)]">{event.nameFr}</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {rentEventH1(event)}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Trouvez une <strong className="text-[var(--foreground)]">voiture de location</strong> ou un{" "}
        <strong className="text-[var(--foreground)]">véhicule</strong> pour{" "}
        <strong className="text-[var(--foreground)]">{event.nameFr}</strong> en RDC. Annonces à Kinshasa, Goma,
        Lubumbashi et dans les provinces — contactez les propriétaires sur DRCCARS.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={browse} className="btn-primary min-h-11 px-5 text-[13px]">
          Voir les annonces
        </Link>
        <Link href="/location-voiture" className="btn-secondary min-h-11 px-5 text-[13px]">
          Toutes les locations
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Suggestions
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {event.keywords.map((k) => (
            <li
              key={k}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)]"
            >
              {k}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {event.nameFr} par ville
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_CITIES.slice(0, 12).map((c) => (
            <li key={c.slug}>
              <Link
                href={rentBrowseHref(c, event)}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
              >
                {event.nameFr} — {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
