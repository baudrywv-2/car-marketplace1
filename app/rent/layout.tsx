import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location de voiture en RDC (Kinshasa) — événements & tourisme",
  description:
    "Trouvez une location de voiture en RDC, notamment à Kinshasa, pour mariages, tourisme, événements d’entreprise et transferts. Parcourez les annonces et contactez les propriétaires.",
  keywords: [
    "location véhicule kinshasa",
    "location voiture kinshasa",
    "location voiture de luxe kinshasa",
    "location 4x4 kinshasa",
    "location de voiture avec chauffeur kinshasa",
  ],
  alternates: { canonical: "/rent" },
  openGraph: {
    title: "Location de voiture à Kinshasa",
    description:
      "Location de voiture à Kinshasa pour événements et tourisme. Parcourez les annonces sur DRCCARS.",
    url: "/rent",
  },
};

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

