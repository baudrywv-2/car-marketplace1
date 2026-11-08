import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: {
    absolute: "Location voiture pour événement RDC | Mariage voyage ONG — DRCCARS",
  },
  description:
    "Louer une voiture ou un véhicule pour mariage, voyage, tourisme, ONG et entreprises en RDC. Guide location sur DRCCARS.",
  keywords: [
    "voiture de location pour tout événement",
    "location voiture mariage RDC",
    "location véhicule ONG",
    "location voiture voyage",
    "location voiture tourisme",
  ],
  alternates: { canonical: `${SITE_URL}/guides/location-voiture-evenement` },
};

export default function GuideLocationPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Voiture de location pour tout événement en RDC
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        Besoin d&apos;un <strong className="text-[var(--foreground)]">véhicule de location</strong> pour un mariage, un
        voyage, du tourisme ou une mission ONG ? DRCCARS regroupe les annonces de location à Kinshasa, Goma et ailleurs.
      </p>
      <ul className="mt-6 space-y-3 text-[14px] text-[var(--muted-foreground)]">
        <li>
          <Link href="/location-voiture/pour/mariage" className="text-[var(--accent)] hover:underline">
            Location voiture mariage
          </Link>
        </li>
        <li>
          <Link href="/location-voiture/pour/voyage" className="text-[var(--accent)] hover:underline">
            Location voiture voyage
          </Link>
        </li>
        <li>
          <Link href="/location-voiture/pour/tourisme" className="text-[var(--accent)] hover:underline">
            Location tourisme
          </Link>
        </li>
        <li>
          <Link href="/location-voiture/pour/ong" className="text-[var(--accent)] hover:underline">
            Location véhicule ONG
          </Link>
        </li>
        <li>
          <Link href="/location-voiture/goma" className="text-[var(--accent)] hover:underline">
            Location voiture Goma
          </Link>
        </li>
      </ul>
      <p className="mt-8">
        <Link href="/rent" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Voir les locations
        </Link>
      </p>
    </article>
  );
}
