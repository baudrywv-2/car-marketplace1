import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allSeoPhraseSlugs,
  getSeoPhrase,
  seoPhraseCanonical,
} from "@/lib/seo-phrases";
import { SEO_CITIES } from "@/lib/seo-locations";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSeoPhraseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPhrase(slug);
  if (!page) return {};
  const canonical = seoPhraseCanonical(page.slug);
  return {
    title: { absolute: page.title },
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function AnnoncesPhrasePage({ params }: Props) {
  const { slug } = await params;
  const page = getSeoPhrase(slug);
  if (!page) notFound();

  const browse = page.carsQuery.includes("listingType=rent")
    ? `/rent`
    : `/cars?${page.carsQuery}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <nav className="mb-6 flex flex-wrap gap-1 text-[11px] text-[var(--muted-foreground)]">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{page.h1}</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {page.h1}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">{page.body}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={browse} className="btn-primary min-h-11 px-5 text-[13px]">
          Voir les annonces
        </Link>
        <Link href="/dashboard/cars/new" className="btn-secondary min-h-11 px-5 text-[13px]">
          Déposer une annonce
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Mots-clés / suggestions
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {page.keywords.map((k) => (
            <li
              key={k}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)]"
            >
              {k}
            </li>
          ))}
        </ul>
      </section>

      {(page.related?.length || 0) > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Liens utiles
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {page.related!.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="inline-block rounded-full border border-[var(--accent)]/35 px-3 py-1.5 text-[11px] text-[var(--accent)]"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Voiture par ville
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_CITIES.slice(0, 12).map((c) => (
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
