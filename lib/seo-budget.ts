export type SeoBudgetHub = {
  slug: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  /** Cars browse query (sale + price bounds). */
  carsQuery: string;
  minPrice?: number;
  maxPrice?: number;
  keywords: string[];
};

export const SEO_BUDGET_HUBS: SeoBudgetHub[] = [
  {
    slug: "sous-3000",
    label: "Moins de 3 000 $",
    h1: "Voitures à vendre sous 3 000 $ en RDC",
    title: "Voitures sous 3 000 $ RDC | Occasion pas cher — DRCCARS",
    description:
      "Annonces de voitures d'occasion à moins de 3 000 USD en RDC. Kinshasa, Goma, Lubumbashi — contactez les vendeurs sur DRCCARS.",
    carsQuery: "listingType=sale&maxPrice=3000",
    maxPrice: 3000,
    keywords: ["voiture pas cher RDC", "voiture sous 3000", "occasion pas cher Kinshasa"],
  },
  {
    slug: "sous-5000",
    label: "Moins de 5 000 $",
    h1: "Voitures à vendre sous 5 000 $ en RDC",
    title: "Voitures sous 5 000 $ RDC | Budget occasion — DRCCARS",
    description:
      "Véhicules d'occasion à moins de 5 000 USD en République Démocratique du Congo. Comparez les annonces sur DRCCARS.",
    carsQuery: "listingType=sale&maxPrice=5000",
    maxPrice: 5000,
    keywords: ["voiture sous 5000 RDC", "budget voiture Goma", "occasion 5000"],
  },
  {
    slug: "sous-10000",
    label: "Moins de 10 000 $",
    h1: "Voitures à vendre sous 10 000 $ en RDC",
    title: "Voitures sous 10 000 $ RDC | Occasion — DRCCARS",
    description:
      "Voitures d'occasion jusqu'à 10 000 USD en RDC. Filtrez et contactez les vendeurs locaux sur DRCCARS.",
    carsQuery: "listingType=sale&maxPrice=10000",
    maxPrice: 10000,
    keywords: ["voiture sous 10000 RDC", "SUV occasion RDC", "acheter voiture 10000"],
  },
  {
    slug: "sous-25000",
    label: "Moins de 25 000 $",
    h1: "Voitures à vendre sous 25 000 $ en RDC",
    title: "Voitures sous 25 000 $ RDC | Occasion premium — DRCCARS",
    description:
      "Occasions jusqu'à 25 000 USD en RDC : SUV, 4x4, berlines. Annonces avec photos et contact vendeur sur DRCCARS.",
    carsQuery: "listingType=sale&maxPrice=25000",
    maxPrice: 25000,
    keywords: ["voiture sous 25000 RDC", "prado occasion RDC", "4x4 occasion Kinshasa"],
  },
];

export function getSeoBudgetHub(slug: string): SeoBudgetHub | undefined {
  return SEO_BUDGET_HUBS.find((h) => h.slug === slug);
}

export function allSeoBudgetSlugs(): string[] {
  return SEO_BUDGET_HUBS.map((h) => h.slug);
}

export function seoBudgetBrowseHref(hub: SeoBudgetHub): string {
  return `/cars?${hub.carsQuery}`;
}
