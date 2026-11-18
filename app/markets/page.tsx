import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import { SEO_NEIGHBOR_MARKETS } from "@/lib/seo-neighbors";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";

const TITLE = "DRC Cars for Nearby Countries | Rwanda Uganda Zambia Angola — DRCCARS";
const DESCRIPTION =
  "Buy used cars listed in the DRC from nearby markets: Rwanda, Uganda, Congo-Brazzaville, Zambia, and Angola. City hubs on DRCCARS.";
const images = seoSocialImages(null, TITLE);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "DRC car marketplace",
    "buy car Rwanda DRC",
    "used cars East Africa DRC",
    "Kinshasa cars Brazzaville",
    "Lubumbashi cars Zambia",
  ],
  alternates: { canonical: `${SITE_URL}/markets` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/markets`,
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

export default function MarketsHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
        DRC marketplace for nearby countries
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        DRCCARS is built for the Democratic Republic of the Congo — and useful for buyers in neighboring countries who
        can view cars in border cities. Pick your market to see the best DRC cities to start with.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {SEO_NEIGHBOR_MARKETS.map((m) => (
          <li key={m.slug}>
            <Link
              href={`/markets/${m.slug}`}
              className="block rounded-lg border border-[var(--border)] px-4 py-3.5 hover:border-[var(--accent)]/45"
            >
              <span className="font-semibold text-[var(--accent)]">{m.name}</span>
              {m.nameLocal ? (
                <span className="ml-2 text-[11px] text-[var(--muted-foreground)]">({m.nameLocal})</span>
              ) : null}
              <span className="mt-1 block text-[12px] text-[var(--muted-foreground)] line-clamp-2">
                {m.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[12px]">
        <Link href="/annonces/used-cars-drc" className="text-[var(--accent)] hover:underline">
          Used cars DRC (EN)
        </Link>
        <Link href="/annonces/buy-car-drc" className="text-[var(--accent)] hover:underline">
          Buy a car in DRC
        </Link>
        <Link href="/voitures-a-vendre/rdc" className="text-[var(--accent)] hover:underline">
          Voitures à vendre (FR)
        </Link>
        <Link href="/guides/buy-used-car-drc" className="text-[var(--accent)] hover:underline">
          English buying guide
        </Link>
      </p>
    </div>
  );
}
