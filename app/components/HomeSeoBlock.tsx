import Link from "next/link";
import { SEO_CITIES } from "@/lib/seo-locations";

/** Crawlable French SEO block on the homepage (competitors use dense listing + city copy). */
export default function HomeSeoBlock() {
  const topCities = SEO_CITIES.slice(0, 12);

  return (
    <section className="border-t border-white/10 bg-gradient-to-b from-[#0a0a0b] to-black px-4 py-11 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <h2 className="section-title font-mono text-xl font-bold tracking-tight sm:text-2xl">
          Voitures à vendre en RDC — Goma, Kinshasa, Lubumbashi
        </h2>
        <p className="mt-4 text-[14px] leading-relaxed text-white/65">
          DRCCARS est la marketplace pour <strong className="text-white/90">acheter</strong> et{" "}
          <strong className="text-white/90">vendre</strong> une voiture d&apos;occasion en République Démocratique du
          Congo. Trouvez une <strong className="text-white/90">voiture Goma</strong>,{" "}
          <strong className="text-white/90">voiture Kinshasa</strong> ou{" "}
          <strong className="text-white/90">voiture Lubumbashi</strong>, un véhicule à vendre, ou une{" "}
          <strong className="text-white/90">voiture de location</strong> pour mariage, voyage, tourisme et ONG —
          sans passer par les annonces génériques.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Link
            href="/voitures-a-vendre/goma"
            className="rounded-[var(--radius-lg)] border border-[var(--accent)]/30 bg-black/40 px-3 py-3.5 text-[12px] text-white/80 transition hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]/30"
          >
            <span className="block font-semibold text-[var(--accent)]">Voiture Goma</span>
            Voitures à vendre à Goma (Nord-Kivu)
          </Link>
          <Link
            href="/voitures-a-vendre/kinshasa"
            className="rounded-[var(--radius-lg)] border border-[var(--accent)]/30 bg-black/40 px-3 py-3.5 text-[12px] text-white/80 transition hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]/30"
          >
            <span className="block font-semibold text-[var(--accent)]">Voiture Kinshasa</span>
            Occasions et véhicules à vendre
          </Link>
          <Link
            href="/location-voiture"
            className="rounded-[var(--radius-lg)] border border-[var(--accent)]/30 bg-black/40 px-3 py-3.5 text-[12px] text-white/80 transition hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]/30"
          >
            <span className="block font-semibold text-[var(--accent)]">Location véhicule</span>
            Mariage, voyage, tourisme, ONG
          </Link>
        </div>

        <h3 className="mt-9 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Parcourir par ville</h3>
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {topCities.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/voiture/${c.slug}`}
                className="inline-block rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-white/70 transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent-muted)]/25 hover:text-white"
              >
                Voiture {c.name}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[12px] text-white/50">
          Guides :{" "}
          <Link href="/guides/acheter-voiture-rdc" className="text-[var(--accent)] hover:underline">
            Acheter une voiture en RDC
          </Link>
          {" · "}
          <Link href="/guides/vendre-voiture-rdc" className="text-[var(--accent)] hover:underline">
            Vendre sa voiture
          </Link>
          {" · "}
          <Link href="/guides/location-voiture-evenement" className="text-[var(--accent)] hover:underline">
            Location pour événement
          </Link>
        </p>
      </div>
    </section>
  );
}
