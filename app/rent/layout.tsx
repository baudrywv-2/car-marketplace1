import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";

/** Browse UI at /rent — SEO canonical prefers the richer /location-voiture landing. */
const TITLE = "Location voiture & véhicule RDC | Mariage voyage tourisme ONG — DRCCARS";
const DESCRIPTION =
  "Voiture de location pour tout événement en RDC : mariages, voyage, tourisme, ONG, entreprises, aéroport. Kinshasa, Goma, Lubumbashi.";
const OG_TITLE = "Location voiture pour tout événement en RDC";
const OG_DESCRIPTION = "Louez un véhicule pour mariage, voyage, tourisme ou ONG. Annonces sur DRCCARS.";
const images = seoSocialImages(null, OG_TITLE);
const canonical = `${SITE_URL}/location-voiture`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "location voiture RDC",
    "véhicule de location",
    "voiture de location",
    "voiture de location pour tout événement",
    "location voiture mariage",
    "location voiture voyage",
    "location voiture tourisme",
    "location véhicule ONG",
    "location voiture kinshasa",
    "location voiture goma",
    "agence vente voyage",
    "location 4x4 kinshasa",
  ],
  alternates: { canonical },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: canonical,
    type: "website",
    images,
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: seoTwitterImages(images),
  },
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
