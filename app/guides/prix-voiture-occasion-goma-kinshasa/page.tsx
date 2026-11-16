import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { SEO_BUDGET_HUBS } from "@/lib/seo-budget";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Prix voiture occasion Goma & Kinshasa | Budgets RDC — DRCCARS" },
  description:
    "Repères de prix pour voitures d'occasion à Goma et Kinshasa : budgets sous 3 000 $ à 25 000 $. Annonces DRCCARS.",
  keywords: [
    "prix voiture goma",
    "prix voiture kinshasa",
    "voiture occasion prix RDC",
    "budget voiture congo",
  ],
  alternates: { canonical: `${SITE_URL}/guides/prix-voiture-occasion-goma-kinshasa` },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quel budget pour une voiture à Goma ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les prix varient selon marque, année et état. Sur DRCCARS, filtrez par budget (sous 3 000 $, 5 000 $, 10 000 $, 25 000 $) puis comparez les annonces Goma.",
      },
    },
    {
      "@type": "Question",
      name: "Les prix Kinshasa sont-ils différents de Goma ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, l'offre et la demande diffèrent par ville. Consultez les pages voitures à vendre Kinshasa et Goma, et les hubs budget pour cadrer votre recherche.",
      },
    },
  ],
};

export default function GuidePrixOccasionPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Prix voiture occasion — Goma & Kinshasa
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Il n&apos;existe pas un seul « prix officiel » : l&apos;année, le kilométrage, le type (berline, SUV, 4x4) et
        la ville changent tout. Utilisez les fourchettes ci-dessous pour cadrer votre recherche sur DRCCARS.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-[var(--foreground)]">Parcourir par budget</h2>
      <ul className="mt-3 space-y-2 text-[14px]">
        {SEO_BUDGET_HUBS.map((h) => (
          <li key={h.slug}>
            <Link href={`/voitures-a-vendre/budget/${h.slug}`} className="text-[var(--accent)] hover:underline">
              {h.label}
            </Link>
            <span className="text-[var(--muted-foreground)]"> — {h.h1}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-[var(--foreground)]">Par ville</h2>
      <ul className="mt-3 flex flex-wrap gap-3 text-[13px]">
        <li>
          <Link href="/voitures-a-vendre/goma" className="text-[var(--accent)] hover:underline">
            Voitures à vendre Goma
          </Link>
        </li>
        <li>
          <Link href="/voitures-a-vendre/kinshasa" className="text-[var(--accent)] hover:underline">
            Voitures à vendre Kinshasa
          </Link>
        </li>
        <li>
          <Link href="/voitures-a-vendre/lubumbashi" className="text-[var(--accent)] hover:underline">
            Lubumbashi
          </Link>
        </li>
        <li>
          <Link href="/acheter-voiture/goma" className="text-[var(--accent)] hover:underline">
            Acheter Goma
          </Link>
        </li>
        <li>
          <Link href="/acheter-voiture/kinshasa" className="text-[var(--accent)] hover:underline">
            Acheter Kinshasa
          </Link>
        </li>
      </ul>

      <p className="mt-6 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        Conseil : comparez au moins 3 annonces dans la même fourchette, demandez un RDV, et vérifiez les documents sur
        place avant tout paiement.
      </p>

      <p className="mt-8">
        <Link href="/cars?listingType=sale" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Voir toutes les annonces
        </Link>
      </p>
    </article>
  );
}
