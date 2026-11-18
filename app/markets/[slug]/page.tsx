import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import {
  SEO_NEIGHBOR_MARKETS,
  allSeoNeighborSlugs,
  getSeoNeighbor,
} from "@/lib/seo-neighbors";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";
import { SEO_CAR_MODELS, seoModelPath } from "@/lib/seo-models";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSeoNeighborSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const market = getSeoNeighbor(slug);
  if (!market) return {};
  const canonical = `${SITE_URL}/markets/${market.slug}`;
  const images = seoSocialImages(null, market.title);
  return {
    title: { absolute: market.title },
    description: market.description,
    keywords: market.keywords,
    alternates: { canonical },
    openGraph: {
      title: market.title,
      description: market.description,
      url: canonical,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: market.title,
      description: market.description,
      images: seoTwitterImages(images),
    },
  };
}

export default async function NeighborMarketPage({ params }: Props) {
  const { slug } = await params;
  const market = getSeoNeighbor(slug);
  if (!market) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <nav className="mb-6 flex flex-wrap gap-1 text-[11px] text-[var(--muted-foreground)]">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span>/</span>
        <Link href="/markets" className="hover:underline">
          Nearby markets
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{market.name}</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {market.h1}
      </h1>

      {market.body.map((p) => (
        <p key={p.slice(0, 40)} className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
          {p}
        </p>
      ))}

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Start with these DRC cities
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {market.borderCities.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/voitures-a-vendre/${c.slug}`}
                className="block rounded-lg border border-[var(--border)] px-3 py-3 text-[13px] hover:border-[var(--accent)]/45"
              >
                <span className="font-semibold text-[var(--accent)]">Cars in {c.name}</span>
                <span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">{c.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/annonces/used-cars-drc" className="btn-primary min-h-11 px-5 text-[13px]">
          Used cars in DRC (EN)
        </Link>
        <Link href="/annonces/buy-car-drc" className="btn-secondary min-h-11 px-5 text-[13px]">
          Buy a car in DRC
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Popular models
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_CAR_MODELS.slice(0, 5).map((m) => (
            <li key={m.modelSlug}>
              <Link
                href={seoModelPath(m, market.borderCities[0]?.slug ?? "rdc")}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
              >
                {m.make} {m.modelLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Other nearby countries
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_NEIGHBOR_MARKETS.filter((m) => m.slug !== market.slug).map((m) => (
            <li key={m.slug}>
              <Link
                href={`/markets/${m.slug}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40"
              >
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
