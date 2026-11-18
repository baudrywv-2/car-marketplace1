import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { SEO_NEIGHBOR_MARKETS } from "@/lib/seo-neighbors";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Used Cars in DRC for East & Central Africa Buyers — DRCCARS" },
  description:
    "English overview for buyers near the DRC: Rwanda, Uganda, Congo-Brazzaville, Zambia, Angola — which DRC cities to search on DRCCARS.",
  keywords: [
    "used cars East Africa DRC",
    "buy car Congo from Rwanda",
    "Kinshasa cars Brazzaville",
    "Lubumbashi cars Zambia",
    "Goma used cars Uganda",
  ],
  alternates: { canonical: `${SITE_URL}/guides/used-cars-east-africa-drc` },
};

export default function GuideUsedCarsEastAfricaPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        Used cars in the DRC for nearby-country buyers
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        DRCCARS aims to be the main car marketplace <strong className="text-[var(--foreground)]">inside the DRC</strong>
        , while remaining useful for clients in neighboring countries who can travel to view a vehicle.
      </p>

      <ul className="mt-8 space-y-4">
        {SEO_NEIGHBOR_MARKETS.map((m) => (
          <li key={m.slug}>
            <h2 className="text-base font-semibold text-[var(--foreground)]">{m.name}</h2>
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">{m.body[0]}</p>
            <p className="mt-2 text-[12px]">
              <Link href={`/markets/${m.slug}`} className="text-[var(--accent)] hover:underline">
                Open {m.name} market page →
              </Link>
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link href="/markets" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          All nearby markets
        </Link>
      </p>
    </article>
  );
}
