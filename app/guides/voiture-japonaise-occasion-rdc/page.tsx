import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { SEO_CAR_MODELS, seoModelPath } from "@/lib/seo-models";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Voiture japonaise d'occasion en RDC | Prado Hilux Noah — DRCCARS" },
  description:
    "Toyota Prado, Hilux, Land Cruiser, Noah, RAV4 : modèles japonais les plus demandés en RDC. Annonces locales sur DRCCARS.",
  keywords: [
    "voiture japonaise RDC",
    "toyota occasion RDC",
    "prado goma",
    "hilux kinshasa",
    "noah lubumbashi",
  ],
  alternates: { canonical: `${SITE_URL}/guides/voiture-japonaise-occasion-rdc` },
};

export default function GuideVoitureJaponaisePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Voiture japonaise d&apos;occasion en RDC
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Sur le marché congolais, les Toyota et autres modèles d&apos;origine japonaise dominent les recherches :
        fiabilité, pièces et valeur de revente. Voici les modèles les plus demandés — avec liens vers les annonces
        locales DRCCARS.
      </p>

      <ul className="mt-8 space-y-5">
        {SEO_CAR_MODELS.map((m) => (
          <li key={m.modelSlug}>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {m.make} {m.modelLabel}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
              Cherchez un {m.modelLabel} déjà en ville plutôt que d&apos;attendre un import.
            </p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
              <Link href={seoModelPath(m, "rdc")} className="text-[var(--accent)] hover:underline">
                RDC
              </Link>
              <Link href={seoModelPath(m, "kinshasa")} className="text-[var(--accent)] hover:underline">
                Kinshasa
              </Link>
              <Link href={seoModelPath(m, "goma")} className="text-[var(--accent)] hover:underline">
                Goma
              </Link>
              <Link href={seoModelPath(m, "lubumbashi")} className="text-[var(--accent)] hover:underline">
                Lubumbashi
              </Link>
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        Pour comparer import et achat local, lisez aussi{" "}
        <Link href="/guides/importer-voiture-japon-rdc" className="text-[var(--accent)] hover:underline">
          importer une voiture du Japon en RDC
        </Link>
        .
      </p>

      <p className="mt-8">
        <Link href="/voitures" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Tous les modèles
        </Link>
      </p>
    </article>
  );
}
