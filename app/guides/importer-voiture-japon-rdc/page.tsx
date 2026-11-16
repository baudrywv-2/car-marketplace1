import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Importer une voiture du Japon en RDC | vs acheter local — DRCCARS" },
  description:
    "Importer une voiture japonaise (BE FORWARD, SBI…) vs acheter une occasion déjà en RDC. Délais, coûts, inspection — guide DRCCARS.",
  keywords: [
    "importer voiture japon RDC",
    "be forward RDC",
    "voiture japon congo",
    "acheter voiture locale RDC",
  ],
  alternates: { canonical: `${SITE_URL}/guides/importer-voiture-japon-rdc` },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Faut-il importer du Japon ou acheter en RDC ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "L'import (via des exportateurs japonais) offre un large stock, mais implique délais, fret, dédouanement et agents. Acheter une occasion déjà en RDC sur DRCCARS permet une inspection sur place et un contact vendeur immédiat.",
      },
    },
    {
      "@type": "Question",
      name: "DRCCARS vend-il des voitures depuis le Japon ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. DRCCARS est une marketplace locale : annonces de vendeurs en RDC. Vous contactez le vendeur, organisez un RDV et négociez hors plateforme.",
      },
    },
  ],
};

export default function GuideImporterJaponPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Importer une voiture du Japon en RDC — ou acheter local ?
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Beaucoup d&apos;acheteurs comparent les catalogues japonais (exportateurs) et le stock déjà présent à{" "}
        <Link href="/voitures-a-vendre/kinshasa" className="text-[var(--accent)] hover:underline">
          Kinshasa
        </Link>
        ,{" "}
        <Link href="/voitures-a-vendre/goma" className="text-[var(--accent)] hover:underline">
          Goma
        </Link>{" "}
        ou Lubumbashi. Voici comment trancher sans se précipiter.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-[var(--foreground)]">Import Japon : points à anticiper</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        <li>Délais de transport et formalités douanières</li>
        <li>Coût total (véhicule + fret + taxes + agent local)</li>
        <li>État réel à l&apos;arrivée — inspection à la livraison</li>
        <li>Volant à droite / configuration marché japonais</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-[var(--foreground)]">Acheter local sur DRCCARS</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        <li>Voir le véhicule et les papiers avant de payer</li>
        <li>Comparer plusieurs{" "}
          <Link href="/voitures/toyota/prado/rdc" className="text-[var(--accent)] hover:underline">
            Prado
          </Link>
          ,{" "}
          <Link href="/voitures/toyota/hilux/rdc" className="text-[var(--accent)] hover:underline">
            Hilux
          </Link>{" "}
          ou Land Cruiser déjà en ville
        </li>
        <li>Demander un rendez-vous via la fiche annonce</li>
      </ul>

      <p className="mt-6 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        DRCCARS ne remplace pas un exportateur : nous mettons en relation acheteurs et vendeurs{" "}
        <strong className="text-[var(--foreground)]">déjà en RDC</strong>. Si vous voulez éviter l&apos;attente
        d&apos;un container, commencez par le stock local.
      </p>

      <p className="mt-8 flex flex-wrap gap-3">
        <Link href="/voitures-a-vendre/rdc" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Voir les annonces RDC
        </Link>
        <Link
          href="/guides/voiture-japonaise-occasion-rdc"
          className="btn-secondary inline-flex min-h-11 items-center px-5 text-[13px]"
        >
          Voitures japonaises populaires
        </Link>
      </p>
    </article>
  );
}
