import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Vendre sa voiture en RDC | Guide annonce occasion — DRCCARS" },
  description:
    "Comment vendre une voiture d'occasion en RDC. Publiez une annonce à Goma, Kinshasa, Lubumbashi et touchez des acheteurs sur DRCCARS.",
  keywords: [
    "vendre voiture RDC",
    "vente voiture occasion RDC",
    "vendre sa voiture Goma",
    "déposer annonce voiture Kinshasa",
  ],
  alternates: { canonical: `${SITE_URL}/guides/vendre-voiture-rdc` },
};

export default function GuideVendrePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Vendre sa voiture d&apos;occasion en RDC
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Pour une <strong className="text-[var(--foreground)]">vente de voiture d&apos;occasion en RDC</strong>, une
        annonce claire (photos, prix, ville) attire plus d&apos;acheteurs sérieux qu&apos;un post isolé sur les réseaux.
      </p>
      <ol className="mt-6 list-decimal space-y-4 pl-5 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        <li>
          Créez un compte vendeur et{" "}
          <Link href="/dashboard/cars/new" className="text-[var(--accent)] hover:underline">
            publiez votre annonce
          </Link>
          .
        </li>
        <li>Ajoutez photos nettes, prix en USD/CDF, province/ville (Goma, Kinshasa, etc.).</li>
        <li>Répondez aux demandes de rendez-vous depuis votre tableau de bord.</li>
        <li>
          Après la vente, marquez l&apos;annonce comme vendue pour garder le catalogue propre.
        </li>
      </ol>
      <p className="mt-8">
        <Link href="/voitures-a-vendre/rdc" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Voir les voitures à vendre
        </Link>
      </p>
    </article>
  );
}
