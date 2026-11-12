import Link from "next/link";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import { SITE_URL } from "@/lib/constants";
import type { SeoSampleCar } from "@/lib/seo-location-cars";
import {
  SEO_CITIES,
  SEO_PROVINCES,
  acheterH1,
  carsBrowseHref,
  locationAutofillPhrases,
  locationGuideParagraphs,
  venteH1,
  type SeoLocation,
} from "@/lib/seo-locations";

type Intent = "vente" | "acheter";

type Props = {
  location: SeoLocation;
  intent: Intent;
  sampleCars?: SeoSampleCar[];
};

export default function SeoLocationLanding({ location, intent, sampleCars = [] }: Props) {
  const h1 = intent === "vente" ? venteH1(location) : acheterH1(location);
  const browse = carsBrowseHref(location);
  const otherIntentHref =
    intent === "vente"
      ? `/acheter-voiture/${location.slug}`
      : `/voitures-a-vendre/${location.slug}`;
  const otherIntentLabel =
    intent === "vente"
      ? `Acheter une voiture ${location.kind === "national" ? "en RDC" : `à ${location.name}`}`
      : `Voitures à vendre ${location.kind === "national" ? "en RDC" : `à ${location.name}`}`;

  const relatedCities = SEO_CITIES.filter((c) => c.slug !== location.slug).slice(0, 12);
  const relatedProvinces = SEO_PROVINCES.filter((p) => p.slug !== location.slug).slice(0, 12);
  const autofill = locationAutofillPhrases(location);
  const guideParagraphs = locationGuideParagraphs(location, intent);
  const hubHref = intent === "vente" ? "/voitures-a-vendre" : "/acheter-voiture";
  const canonicalCityHref =
    intent === "vente" ? `/voitures-a-vendre/${location.slug}` : `/acheter-voiture/${location.slug}`;

  const itemListLd =
    sampleCars.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: h1,
          numberOfItems: sampleCars.length,
          itemListElement: sampleCars.map((car, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: car.title,
              url: `${SITE_URL}/cars/${car.id}`,
              ...(car.image ? { image: car.image } : {}),
              offers: {
                "@type": "Offer",
                price: car.price,
                priceCurrency: car.currency === "CDF" ? "CDF" : "USD",
                availability: "https://schema.org/InStock",
              },
            },
          })),
        }
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-[11px] text-[var(--muted-foreground)]" aria-label="Fil d'Ariane">
        <Link href="/" className="hover:text-[var(--foreground)] hover:underline">
          Accueil
        </Link>
        <span>/</span>
        <Link
          href={intent === "vente" ? "/voitures-a-vendre" : "/acheter-voiture"}
          className="hover:text-[var(--foreground)] hover:underline"
        >
          {intent === "vente" ? "Voitures à vendre" : "Acheter une voiture"}
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{location.name}</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">{h1}</h1>

      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        {intent === "vente" ? (
          location.kind === "national" ? (
            <>
              DRCCARS est la marketplace pour la <strong className="text-[var(--foreground)]">vente de voitures d&apos;occasion en RDC</strong>.
              Publiez ou parcourez des annonces à Kinshasa, Goma, Lubumbashi et dans toutes les provinces.
              Pas d&apos;achat en ligne — contactez les vendeurs ou demandez un rendez-vous.
            </>
          ) : location.kind === "province" ? (
            <>
              Cherchez une <strong className="text-[var(--foreground)]">voiture à vendre en {location.name}</strong> ou un{" "}
              <strong className="text-[var(--foreground)]">véhicule d&apos;occasion</strong> dans cette province.
              DRCCARS connecte acheteurs et vendeurs partout en République Démocratique du Congo.
            </>
          ) : (
            <>
              Trouvez une <strong className="text-[var(--foreground)]">voiture à vendre à {location.name}</strong>
              {location.region ? <> ({location.region})</> : null}, un{" "}
              <strong className="text-[var(--foreground)]">véhicule à vendre</strong> ou une occasion locale.
              Comparez les annonces et contactez les vendeurs sur DRCCARS.
            </>
          )
        ) : location.kind === "national" ? (
          <>
            <strong className="text-[var(--foreground)]">Acheter une voiture en RDC</strong> commence ici : occasions,
            véhicules neufs et annonces locales. Filtrez par ville, marque et budget, puis contactez le vendeur.
          </>
        ) : location.kind === "province" ? (
          <>
            <strong className="text-[var(--foreground)]">Acheter une voiture en {location.name}</strong> — parcourez les
            annonces d&apos;occasion et demandez un rendez-vous avec le vendeur via DRCCARS.
          </>
        ) : (
          <>
            <strong className="text-[var(--foreground)]">Acheter une voiture à {location.name}</strong>
            {location.region ? <> ({location.region})</> : null}. Annonces de véhicules d&apos;occasion près de chez vous,
            contact direct avec les vendeurs sur DRCCARS.
          </>
        )}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={browse} className="btn-primary min-h-11 px-5 text-[13px]">
          Voir les annonces
        </Link>
        <Link href="/dashboard/cars/new" className="btn-secondary min-h-11 px-5 text-[13px]">
          Vendre ma voiture
        </Link>
        <Link href={otherIntentHref} className="btn-ghost min-h-11 px-3 text-[12px]">
          {otherIntentLabel}
        </Link>
      </div>

      <section className="mt-10 max-w-2xl">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {intent === "vente" ? `Vendre ou publier à ${location.name}` : `Acheter à ${location.name}`}
        </h2>
        {guideParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="mt-3 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
            {paragraph}
          </p>
        ))}
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px]">
          <li>
            <Link href={browse} className="text-[var(--accent)] hover:underline">
              Annonces {location.name}
            </Link>
          </li>
          <li>
            <Link href={otherIntentHref} className="text-[var(--accent)] hover:underline">
              {otherIntentLabel}
            </Link>
          </li>
          <li>
            <Link href={hubHref} className="text-[var(--accent)] hover:underline">
              {intent === "vente" ? "Toutes les villes — vente" : "Toutes les villes — achat"}
            </Link>
          </li>
          <li>
            <Link href="/location-voiture" className="text-[var(--accent)] hover:underline">
              Location voiture RDC
            </Link>
          </li>
          <li>
            <Link
              href={intent === "acheter" ? "/guides/acheter-voiture-rdc" : "/guides/vendre-voiture-rdc"}
              className="text-[var(--accent)] hover:underline"
            >
              {intent === "acheter" ? "Guide achat" : "Guide vente"}
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Suggestions de recherche
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {autofill.map((p) => (
            <li key={p}>
              <Link
                href={canonicalCityHref}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
              >
                {p}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/annonces/voiture-d-occasion-a-vendre"
              className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40"
            >
              voiture d&apos;occasion à vendre
            </Link>
          </li>
        </ul>
      </section>

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
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted-foreground)]">
                        DRCCARS
                      </div>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="line-clamp-2 text-[12px] font-medium leading-snug text-[var(--foreground)] group-hover:text-[var(--accent)]">
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
          <p className="mt-3">
            <Link href={browse} className="text-[12px] font-medium text-[var(--accent)] hover:underline">
              Toutes les annonces →
            </Link>
          </p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Autres villes
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {relatedCities.map((c) => (
            <li key={c.slug}>
              <Link
                href={intent === "vente" ? `/voitures-a-vendre/${c.slug}` : `/acheter-voiture/${c.slug}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--foreground)] hover:border-[var(--accent)]/50"
              >
                {c.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={intent === "vente" ? "/voitures-a-vendre/rdc" : "/acheter-voiture/rdc"}
              className="inline-block rounded-full border border-[var(--accent)]/40 px-3 py-1.5 text-[11px] text-[var(--accent)]"
            >
              Toute la RDC
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Provinces
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {relatedProvinces.map((p) => (
            <li key={p.slug}>
              <Link
                href={intent === "vente" ? `/voitures-a-vendre/${p.slug}` : `/acheter-voiture/${p.slug}`}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
