import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voitures d’occasion à vendre en RDC (Kinshasa, Goma, Lubumbashi)",
  description:
    "Parcourez des voitures d’occasion et véhicules à vendre en RDC. Filtrez par ville (Kinshasa, Goma, Lubumbashi), marque et prix, comparez des annonces et contactez les vendeurs.",
  keywords: [
    "voiture occasion kinshasa",
    "voiture occasion lubumbashi",
    "voiture occasion goma",
    "voiture d'occasion rdc",
    "voitures d'occasion",
    "achat voiture goma",
    "agence de vente de voiture à lubumbashi",
    "voiture occasion matadi",
  ],
  alternates: { canonical: "/cars" },
  openGraph: {
    title: "Voitures d’occasion en RDC",
    description:
      "Voitures d’occasion à vendre en RDC. Kinshasa, Goma, Lubumbashi: filtrez, comparez et contactez les vendeurs.",
    url: "/cars",
  },
};

export default function CarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

