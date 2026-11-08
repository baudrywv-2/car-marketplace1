import type { Metadata } from "next";
import Link from "next/link";
import { SEO_CITIES, SEO_PROVINCES } from "@/lib/seo-locations";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Voitures à vendre en RDC par ville | Vente occasion — DRCCARS",
  description:
    "Vente de voitures d'occasion en RDC. Choisissez votre ville ou province : Kinshasa, Goma, Lubumbashi, Bukavu et toutes les régions.",
  alternates: { canonical: `${SITE_URL}/voitures-a-vendre` },
};

export default function VoituresAVendreHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Voitures à vendre en RDC
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Parcourez la vente de véhicules d&apos;occasion par ville et par province. Trouvez une voiture à vendre près de
        chez vous sur DRCCARS.
      </p>
      <p className="mt-4">
        <Link href="/voitures-a-vendre/rdc" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Toute la RDC
        </Link>
      </p>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Villes</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {SEO_CITIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/voitures-a-vendre/${c.slug}`}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--foreground)] hover:border-[var(--accent)]/45"
              >
                Voitures à vendre à {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Provinces</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {SEO_PROVINCES.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/voitures-a-vendre/${p.slug}`}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
              >
                Vente voiture {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-[12px] text-[var(--muted-foreground)]">
        Vous cherchez à{" "}
        <Link href="/acheter-voiture" className="text-[var(--accent)] hover:underline">
          acheter une voiture
        </Link>{" "}
        ? Voir aussi les pages achat.
      </p>
    </div>
  );
}
