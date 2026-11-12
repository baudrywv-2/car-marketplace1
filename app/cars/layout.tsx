import type { Metadata } from "next";

/**
 * Defaults for /cars browse only.
 * Do NOT set alternates.canonical here — it can leak onto /cars/[id]
 * and confuse Google ("Duplicate without user-selected canonical").
 * Canonicals live on page.tsx and cars/[id]/page.tsx.
 */
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
};

export default function CarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
