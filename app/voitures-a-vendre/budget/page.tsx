import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { SEO_BUDGET_HUBS } from "@/lib/seo-budget";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";

const TITLE = "Voitures par budget en RDC | Sous 3k–25k $ — DRCCARS";
const DESCRIPTION =
  "Trouvez une voiture d'occasion selon votre budget en RDC : moins de 3 000 $, 5 000 $, 10 000 $ ou 25 000 $.";
const images = seoSocialImages(null, TITLE);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/voitures-a-vendre/budget` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/voitures-a-vendre/budget`,
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

export default function BudgetHubIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Voitures à vendre par budget
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Choisissez une fourchette de prix, puis ouvrez les annonces filtrées sur DRCCARS.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {SEO_BUDGET_HUBS.map((h) => (
          <li key={h.slug}>
            <Link
              href={`/voitures-a-vendre/budget/${h.slug}`}
              className="block rounded-lg border border-[var(--border)] px-4 py-3.5 text-[13px] text-[var(--foreground)] hover:border-[var(--accent)]/45"
            >
              <span className="font-semibold text-[var(--accent)]">{h.label}</span>
              <span className="mt-1 block text-[12px] text-[var(--muted-foreground)]">{h.h1}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
