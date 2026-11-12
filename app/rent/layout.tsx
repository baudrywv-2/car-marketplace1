import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { seoSocialImages, seoTwitterImages } from "@/lib/seo-og";

const TITLE = "Location voiture & véhicule RDC | Mariage voyage tourisme ONG — DRCCARS";
const DESCRIPTION =
  "Voiture de location pour tout événement en RDC : mariages, voyage, tourisme, ONG, entreprises, aéroport. Kinshasa, Goma, Lubumbashi.";
const OG_TITLE = "Location voiture pour tout événement en RDC";
const OG_DESCRIPTION = "Louez un véhicule pour mariage, voyage, tourisme ou ONG. Annonces sur DRCCARS.";
const images = seoSocialImages(null, OG_TITLE);

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
  alternates: { canonical: `${SITE_URL}/rent` },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: `${SITE_URL}/rent`,
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
