import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Comment acheter une voiture en RDC | Guide occasion — DRCCARS" },
  description:
    "Guide pour acheter une voiture d'occasion en RDC : Kinshasa, Goma, Lubumbashi. Vérifications, prix, rendez-vous vendeur sur DRCCARS.",
  keywords: [
    "acheter voiture RDC",
    "acheter voiture occasion RDC",
    "comment acheter voiture Goma",
    "acheter véhicule Kinshasa",
  ],
  alternates: { canonical: `${SITE_URL}/guides/acheter-voiture-rdc` },
};

export default function GuideAcheterPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Comment acheter une voiture en RDC
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Que vous cherchiez une <strong className="text-[var(--foreground)]">voiture Kinshasa</strong>, une{" "}
        <strong className="text-[var(--foreground)]">voiture Goma</strong> ou un véhicule à Lubumbashi, ce guide
        résume les étapes pour acheter une occasion en toute sérénité sur DRCCARS.
      </p>
      <ol className="mt-6 list-decimal space-y-4 pl-5 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        <li>
          <strong className="text-[var(--foreground)]">Parcourez les annonces</strong> par ville :{" "}
          <Link href="/voiture/goma" className="text-[var(--accent)] hover:underline">
            Goma
          </Link>
          ,{" "}
          <Link href="/voiture/kinshasa" className="text-[var(--accent)] hover:underline">
            Kinshasa
          </Link>
          ,{" "}
          <Link href="/voiture/lubumbashi" className="text-[var(--accent)] hover:underline">
            Lubumbashi
          </Link>
          .
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Comparez</strong> prix, année, kilométrage et photos — utilisez
          les filtres sur{" "}
          <Link href="/cars" className="text-[var(--accent)] hover:underline">
            /cars
          </Link>
          .
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Demandez un rendez-vous</strong> via la fiche annonce pour
          inspecter le véhicule et vérifier les documents.
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Négociez en personne</strong> — DRCCARS met en relation, sans
          vente en ligne opaque.
        </li>
      </ol>
      <p className="mt-8">
        <Link href="/acheter-voiture/rdc" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Acheter une voiture en RDC
        </Link>
      </p>
    </article>
  );
}
