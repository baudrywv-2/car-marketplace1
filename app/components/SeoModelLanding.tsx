import Link from "next/link";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import { SITE_URL } from "@/lib/constants";
import type { SeoSampleCar } from "@/lib/seo-location-cars";
import {
  SEO_CAR_MODELS,
  SEO_MODEL_CITY_SLUGS,
  seoModelBrowseHref,
  seoModelH1,
  seoModelIntro,
  seoModelPath,
  type SeoCarModel,
} from "@/lib/seo-models";
import { getSeoLocation, type SeoLocation } from "@/lib/seo-locations";

type Props = {
  model: SeoCarModel;
  location: SeoLocation;
  sampleCars?: SeoSampleCar[];
};

export default function SeoModelLanding({ model, location, sampleCars = [] }: Props) {
  const h1 = seoModelH1(model, location);
  const browse = seoModelBrowseHref(model, location);
  const intro = seoModelIntro(model, location);
  const venteCity =
    location.kind === "national" ? "/voitures-a-vendre/rdc" : `/voitures-a-vendre/${location.slug}`;

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
              description: `${car.title} — ${model.make} ${model.modelLabel} for sale on DRCCARS${
                car.city || car.province ? ` (${[car.city, car.province].filter(Boolean).join(", ")})` : ""
              }.`,
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
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/voitures" className="hover:underline">
          Modèles
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">
          {model.make} {model.modelLabel}
        </span>
        <span>/</span>
        <span className="text-[var(--foreground)]">{location.name}</span>
      </nav>

      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">{h1}</h1>

      {intro.map((p) => (
        <p key={p.slice(0, 40)} className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
          {p}
        </p>
      ))}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={browse} className="btn-primary min-h-11 px-5 text-[13px]">
          Voir les annonces
        </Link>
        <Link href={venteCity} className="btn-secondary min-h-11 px-5 text-[13px]">
          Voitures à vendre {location.name}
        </Link>
        <Link href={`/acheter-voiture/${location.slug}`} className="btn-ghost min-h-11 px-3 text-[12px]">
          Acheter à {location.name}
        </Link>
      </div>

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

      <section className="mt-12">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Autres villes — {model.modelLabel}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_MODEL_CITY_SLUGS.filter((s) => s !== location.slug).map((slug) => {
            const loc = getSeoLocation(slug);
            if (!loc) return null;
            return (
              <li key={slug}>
                <Link
                  href={seoModelPath(model, slug)}
                  className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] hover:border-[var(--accent)]/45"
                >
                  {model.modelLabel} {loc.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Autres modèles Toyota
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_CAR_MODELS.filter((m) => m.modelSlug !== model.modelSlug).map((m) => (
            <li key={m.modelSlug}>
              <Link
                href={seoModelPath(m, location.slug)}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
              >
                {m.make} {m.modelLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-[12px] text-[var(--muted-foreground)]">
        Guides :{" "}
        <Link href="/guides/voiture-japonaise-occasion-rdc" className="text-[var(--accent)] hover:underline">
          Voiture japonaise en RDC
        </Link>
        {" · "}
        <Link href="/guides/importer-voiture-japon-rdc" className="text-[var(--accent)] hover:underline">
          Importer vs acheter local
        </Link>
        {" · "}
        <Link href="/guides/acheter-voiture-rdc" className="text-[var(--accent)] hover:underline">
          Guide achat
        </Link>
      </p>
    </div>
  );
}
