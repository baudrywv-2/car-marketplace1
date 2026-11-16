import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import {
  SEO_BUDGET_HUBS,
  allSeoBudgetSlugs,
  getSeoBudgetHub,
  seoBudgetBrowseHref,
} from "@/lib/seo-budget";
import { SEO_CAR_MODELS, seoModelPath } from "@/lib/seo-models";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSeoBudgetSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hub = getSeoBudgetHub(slug);
  if (!hub) return {};
  const canonical = `${SITE_URL}/voitures-a-vendre/budget/${hub.slug}`;
  const images = seoSocialImages(null, hub.title);
  return {
    title: { absolute: hub.title },
    description: hub.description,
    keywords: hub.keywords,
    alternates: { canonical },
    openGraph: {
      title: hub.title,
      description: hub.description,
      url: canonical,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: hub.title,
      description: hub.description,
      images: seoTwitterImages(images),
    },
  };
}

export default async function BudgetHubPage({ params }: Props) {
  const { slug } = await params;
  const hub = getSeoBudgetHub(slug);
  if (!hub) notFound();
  const browse = seoBudgetBrowseHref(hub);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <nav className="mb-6 flex flex-wrap gap-1 text-[11px] text-[var(--muted-foreground)]">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/voitures-a-vendre" className="hover:underline">
          Voitures à vendre
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">Budget</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        {hub.h1}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Filtrez les annonces d&apos;occasion selon votre budget en RDC. Comparez photos et prix, puis contactez le
        vendeur sur DRCCARS — sans paiement en ligne.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={browse} className="btn-primary min-h-11 px-5 text-[13px]">
          Voir les annonces {hub.label.toLowerCase()}
        </Link>
        <Link href="/voitures-a-vendre/rdc" className="btn-secondary min-h-11 px-5 text-[13px]">
          Toute la RDC
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Autres budgets
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_BUDGET_HUBS.filter((h) => h.slug !== hub.slug).map((h) => (
            <li key={h.slug}>
              <Link
                href={`/voitures-a-vendre/budget/${h.slug}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
              >
                {h.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Modèles populaires
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_CAR_MODELS.map((m) => (
            <li key={m.modelSlug}>
              <Link
                href={seoModelPath(m, "rdc")}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40"
              >
                {m.make} {m.modelLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-[12px] text-[var(--muted-foreground)]">
        <Link href="/guides/prix-voiture-occasion-goma-kinshasa" className="text-[var(--accent)] hover:underline">
          Guide des prix occasion Goma & Kinshasa
        </Link>
      </p>
    </div>
  );
}
