import type { Metadata } from "next";
import Link from "next/link";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import { SEO_CITIES, SEO_NATIONAL, SEO_PROVINCES } from "@/lib/seo-locations";
import { SITE_URL } from "@/lib/constants";
import { fetchSeoSampleCars } from "@/lib/seo-location-cars";
import { firstSampleImage, seoSocialImages, seoTwitterImages } from "@/lib/seo-og";

export const revalidate = 600;

const TITLE = "Voitures à vendre en RDC par ville | Vente occasion — DRCCARS";
const DESCRIPTION =
  "Vente de voitures d'occasion en RDC. Choisissez votre ville ou province : Kinshasa, Goma, Lubumbashi, Bukavu et toutes les régions.";

export async function generateMetadata(): Promise<Metadata> {
  const samples = await fetchSeoSampleCars(SEO_NATIONAL, 6);
  const images = seoSocialImages(firstSampleImage(samples), TITLE);
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/voitures-a-vendre` },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: `${SITE_URL}/voitures-a-vendre`,
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
}

export default async function VoituresAVendreHubPage() {
  const sampleCars = await fetchSeoSampleCars(SEO_NATIONAL, 6);
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

      {sampleCars.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Annonces récentes
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {sampleCars.map((car) => (
              <li key={car.id}>
                <Link
                  href={`/cars/${car.id}`}
                  className="group block overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/45"
                >
                  <div className="relative aspect-[4/3] bg-[var(--background)]">
                    {car.image ? (
                      <OptimizedCarImage
                        src={car.image}
                        alt={car.title}
                        sizes="(max-width: 640px) 50vw, 33vw"
                        thumbWidth={480}
                        quality={70}
                      />
                    ) : null}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="line-clamp-2 text-[12px] font-medium leading-snug text-[var(--foreground)]">
                      {car.title}
                    </p>
                    <p className="mt-1 font-mono text-[12px] text-[var(--accent)]">
                      {car.currency === "CDF" ? "FC" : "$"}
                      {Number(car.price).toLocaleString()}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      <p className="mt-8 text-[12px] text-[var(--muted-foreground)]">
        Villes populaires (achat) :{" "}
        <Link href="/acheter-voiture/kinshasa" className="text-[var(--accent)] hover:underline">
          Kinshasa
        </Link>
        {" · "}
        <Link href="/acheter-voiture/goma" className="text-[var(--accent)] hover:underline">
          Goma
        </Link>
        {" · "}
        <Link href="/acheter-voiture/lubumbashi" className="text-[var(--accent)] hover:underline">
          Lubumbashi
        </Link>
        {" · "}
        <Link href="/acheter-voiture/bukavu" className="text-[var(--accent)] hover:underline">
          Bukavu
        </Link>
        {" · "}
        <Link href="/acheter-voiture" className="text-[var(--accent)] hover:underline">
          toutes les pages achat
        </Link>
      </p>
      <p className="mt-3 text-[12px] text-[var(--muted-foreground)]">
        Guides :{" "}
        <Link href="/guides/vendre-voiture-rdc" className="text-[var(--accent)] hover:underline">
          Vendre sa voiture
        </Link>
        {" · "}
        <Link href="/guides/acheter-voiture-rdc" className="text-[var(--accent)] hover:underline">
          Acheter en RDC
        </Link>
        {" · "}
        <Link href="/location-voiture" className="text-[var(--accent)] hover:underline">
          Location voiture
        </Link>
      </p>
    </div>
  );
}
