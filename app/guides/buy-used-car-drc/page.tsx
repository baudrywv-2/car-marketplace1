import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "How to Buy a Used Car in DRC | English Guide — DRCCARS" },
  description:
    "English guide to buying a used car in the Democratic Republic of the Congo: cities, viewing, documents, and DRCCARS listings.",
  keywords: [
    "buy used car DRC",
    "how to buy a car in Congo",
    "used cars Kinshasa guide",
    "buy car Goma English",
  ],
  alternates: { canonical: `${SITE_URL}/guides/buy-used-car-drc` },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is DRCCARS available in English?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can switch the site language to English in the app. Listings are local to the DRC; English SEO pages help regional buyers find the right city hubs.",
      },
    },
    {
      "@type": "Question",
      name: "Can buyers from Rwanda or Zambia use DRCCARS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes for discovery and contacting sellers. Cars are listed in the DRC — you travel to view them. See /markets for border-city guidance.",
      },
    },
  ],
};

export default function GuideBuyUsedCarDrcEnPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--foreground)]">
        How to buy a used car in the DRC
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted-foreground)]">
        DRCCARS is the local marketplace for used cars in the Democratic Republic of the Congo. This English guide is
        for residents and nearby-country buyers (Rwanda, Uganda, Congo-Brazzaville, Zambia, Angola).
      </p>

      <ol className="mt-6 list-decimal space-y-4 pl-5 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
        <li>
          <strong className="text-[var(--foreground)]">Pick a city</strong> —{" "}
          <Link href="/annonces/buy-car-kinshasa" className="text-[var(--accent)] hover:underline">
            Kinshasa
          </Link>
          ,{" "}
          <Link href="/annonces/buy-car-goma" className="text-[var(--accent)] hover:underline">
            Goma
          </Link>
          , or{" "}
          <Link href="/annonces/buy-car-lubumbashi" className="text-[var(--accent)] hover:underline">
            Lubumbashi
          </Link>
          .
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Compare listings</strong> — photos, year, price. Try models like{" "}
          <Link href="/voitures/toyota/prado/rdc" className="text-[var(--accent)] hover:underline">
            Prado
          </Link>{" "}
          or{" "}
          <Link href="/voitures/toyota/hilux/rdc" className="text-[var(--accent)] hover:underline">
            Hilux
          </Link>
          .
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Contact the seller</strong> — phone or WhatsApp on the listing;
          request a viewing (RDV).
        </li>
        <li>
          <strong className="text-[var(--foreground)]">Inspect on site</strong> — papers and vehicle condition before
          any payment. DRCCARS does not process car payments.
        </li>
      </ol>

      <p className="mt-8 text-[14px] text-[var(--muted-foreground)]">
        From a neighboring country? Start at{" "}
        <Link href="/markets" className="text-[var(--accent)] hover:underline">
          Nearby markets
        </Link>
        . French guide:{" "}
        <Link href="/guides/acheter-voiture-rdc" className="text-[var(--accent)] hover:underline">
          Acheter une voiture en RDC
        </Link>
        .
      </p>

      <p className="mt-8">
        <Link href="/annonces/used-cars-drc" className="btn-primary inline-flex min-h-11 items-center px-5 text-[13px]">
          Browse used cars (EN)
        </Link>
      </p>
    </article>
  );
}
