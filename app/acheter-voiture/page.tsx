import type { Metadata } from "next";
import Link from "next/link";
import { SEO_CITIES, SEO_PROVINCES } from "@/lib/seo-locations";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Acheter une voiture en RDC par ville | Occasion — DRCCARS",
  description:
    "Acheter une voiture d'occasion en RDC. Pages par ville et province : Kinshasa, Goma, Lubumbashi, Bukavu et partout au Congo.",
  alternates: { canonical: `${SITE_URL}/acheter-voiture` },
};

export default function AcheterVoitureHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Acheter une voiture en RDC
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Trouvez où acheter un véhicule d&apos;occasion près de chez vous. Choisissez une ville ou une province, puis
        contactez les vendeurs sur DRCCARS.
      </p>
      <p className="mt-4">
        <Link href="/acheter-voiture/rdc" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Toute la RDC
        </Link>
      </p>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Villes</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {SEO_CITIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/acheter-voiture/${c.slug}`}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--foreground)] hover:border-[var(--accent)]/45"
              >
                Acheter une voiture à {c.name}
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
                href={`/acheter-voiture/${p.slug}`}
                className="block rounded-lg border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
              >
                Acheter en {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-[12px] text-[var(--muted-foreground)]">
        Vous vendez ? Voir{" "}
        <Link href="/voitures-a-vendre" className="text-[var(--accent)] hover:underline">
          voitures à vendre
        </Link>
        .
      </p>
    </div>
  );
}
