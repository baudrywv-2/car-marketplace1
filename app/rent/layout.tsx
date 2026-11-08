import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location voiture & véhicule RDC | Mariage voyage tourisme ONG — DRCCARS",
  description:
    "Voiture de location pour tout événement en RDC : mariages, voyage, tourisme, ONG, entreprises, aéroport. Kinshasa, Goma, Lubumbashi.",
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
  alternates: { canonical: "/rent" },
  openGraph: {
    title: "Location voiture pour tout événement en RDC",
    description:
      "Louez un véhicule pour mariage, voyage, tourisme ou ONG. Annonces sur DRCCARS.",
    url: "/rent",
  },
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

