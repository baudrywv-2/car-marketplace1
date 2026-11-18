import { SITE_URL } from "@/lib/constants";

/** Exact-match / Google Suggest phrase landings (national). */
export type SeoPhrasePage = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  body: string;
  carsQuery: string;
  related?: { href: string; label: string }[];
};

export const SEO_PHRASE_PAGES: SeoPhrasePage[] = [
  {
    slug: "voiture-d-occasion-a-vendre",
    title: "Voiture d'occasion à vendre en RDC | Occasion a vendre — DRCCARS",
    h1: "Voiture d'occasion à vendre",
    description:
      "Voiture d'occasion à vendre en RDC. Voiture occasion a vendre à Kinshasa, Goma, Lubumbashi. Parcourez les annonces sur DRCCARS.",
    keywords: [
      "voiture d'occasion à vendre",
      "voiture occasion a vendre",
      "voiture d occasion a vendre",
      "voitures d'occasion à vendre",
      "vente voiture occasion",
    ],
    body: "Cherchez une voiture d'occasion à vendre en République Démocratique du Congo. Sur DRCCARS, les vendeurs publient des annonces locales — comparez prix et contactez directement.",
    carsQuery: "listingType=sale",
    related: [
      { href: "/voitures-a-vendre/rdc", label: "Voitures à vendre en RDC" },
      { href: "/voiture/goma", label: "Voiture Goma" },
      { href: "/voiture/kinshasa", label: "Voiture Kinshasa" },
    ],
  },
  {
    slug: "voiture-occasion-a-vendre",
    title: "Voiture occasion a vendre RDC | Véhicule occasion — DRCCARS",
    h1: "Voiture occasion a vendre",
    description:
      "Voiture occasion a vendre en RDC. Annonces de véhicules d'occasion — Kinshasa, Goma, Lubumbashi et provinces.",
    keywords: ["voiture occasion a vendre", "voiture occasion à vendre", "occasion a vendre RDC"],
    body: "Tapez souvent « voiture occasion a vendre » ? DRCCARS regroupe les annonces d'occasion partout en RDC pour acheter ou vendre plus vite.",
    carsQuery: "listingType=sale",
  },
  {
    slug: "vehicule-a-vendre",
    title: "Véhicule à vendre en RDC | Voiture à vendre — DRCCARS",
    h1: "Véhicule à vendre",
    description:
      "Véhicule à vendre en RDC : voitures, 4x4, pick-up. Annonces locales sur DRCCARS.",
    keywords: ["véhicule à vendre", "vehicule a vendre", "véhicule à vendre RDC"],
    body: "Trouvez un véhicule à vendre près de chez vous. Marketplace auto DRCCARS pour la vente et l'achat en RDC.",
    carsQuery: "listingType=sale",
  },
  {
    slug: "agence-vente-voiture",
    title: "Agence vente voiture RDC | Vente auto Kinshasa Goma — DRCCARS",
    h1: "Agence de vente de voiture en RDC",
    description:
      "Agence vente voiture et marketplace auto en RDC. Vendez ou achetez une voiture d'occasion — Kinshasa, Goma, Lubumbashi.",
    keywords: [
      "agence vente voiture",
      "agence de vente de voiture",
      "agence vente auto RDC",
      "agence automobile RDC",
    ],
    body: "DRCCARS fonctionne comme votre agence de vente de voiture en ligne en RDC : déposez une annonce, touchez des acheteurs à Kinshasa, Goma, Lubumbashi et dans les provinces.",
    carsQuery: "listingType=sale",
    related: [
      { href: "/dashboard/cars/new", label: "Vendre ma voiture" },
      { href: "/rent", label: "Location / voyage" },
    ],
  },
  {
    slug: "agence-vente-voyage",
    title: "Agence vente voyage & location voiture RDC | Tourisme — DRCCARS",
    h1: "Agence vente voyage & location voiture",
    description:
      "Location voiture pour voyage et tourisme en RDC. Mariages, transferts, événements — annonces sur DRCCARS.",
    keywords: [
      "agence de vente voyage",
      "agence vente voyage",
      "location voiture voyage RDC",
      "location voiture tourisme",
      "location voiture Goma",
      "location voiture Kinshasa",
    ],
    body: "Pour un voyage en RDC, louez une voiture via les annonces DRCCARS (tourisme, aéroport, événements). Besoin d'acheter ou vendre un véhicule ? Passez aussi par nos pages vente.",
    carsQuery: "listingType=rent",
    related: [
      { href: "/rent", label: "Location de voiture" },
      { href: "/rent?event=tourism", label: "Location tourisme" },
      { href: "/voitures-a-vendre/rdc", label: "Voitures à vendre" },
    ],
  },
  {
    slug: "vente-voiture-occasion-rdc",
    title: "Vente voiture occasion RDC | Vente de voiture d'occasion — DRCCARS",
    h1: "Vente de voiture d'occasion en RDC",
    description:
      "Vente voiture occasion RDC. Déposez ou parcourez des annonces à Kinshasa, Goma, Lubumbashi.",
    keywords: [
      "vente voiture occasion RDC",
      "vente de voiture d'occasion en RDC",
      "vente auto occasion Congo",
    ],
    body: "La vente de voiture d'occasion en RDC passe par DRCCARS : annonces claires, contact vendeur, rendez-vous sur place.",
    carsQuery: "listingType=sale",
  },
  {
    slug: "voiture-de-location",
    title: "Voiture de location RDC | Véhicule de location événement — DRCCARS",
    h1: "Voiture de location",
    description:
      "Voiture de location et véhicule de location en RDC pour tout événement : mariages, voyage, tourisme, ONG.",
    keywords: [
      "voiture de location",
      "véhicule de location",
      "vehicule de location",
      "louer une voiture RDC",
      "location auto RDC",
    ],
    body: "Besoin d'une voiture de location ou d'un véhicule de location en RDC ? Sur DRCCARS, louez pour mariages, voyage, tourisme, ONG et entreprises.",
    carsQuery: "listingType=rent",
    related: [
      { href: "/location-voiture", label: "Location par ville & événement" },
      { href: "/location-voiture/pour/tout-evenement", label: "Tout événement" },
      { href: "/rent", label: "Catalogue location" },
    ],
  },
  {
    slug: "voiture-location-evenement",
    title: "Voiture de location pour tout événement RDC | Mariage voyage ONG — DRCCARS",
    h1: "Voiture de location pour tout événement",
    description:
      "Voiture de location pour tout événement en RDC : mariages, voyage, tourisme, ONG, entreprises, aéroport.",
    keywords: [
      "voiture de location pour tout événement",
      "voiture location événement",
      "location voiture mariage",
      "location voiture voyage",
      "location voiture tourisme",
      "location véhicule ONG",
    ],
    body: "Une seule plateforme pour louer un véhicule quel que soit l'événement — mariage, voyage, tourisme, mission ONG ou transfert aéroport.",
    carsQuery: "listingType=rent",
    related: [
      { href: "/location-voiture/pour/mariage", label: "Mariages" },
      { href: "/location-voiture/pour/voyage", label: "Voyage" },
      { href: "/location-voiture/pour/tourisme", label: "Tourisme" },
      { href: "/location-voiture/pour/ong", label: "ONG" },
    ],
  },
  {
    slug: "location-vehicule-ong",
    title: "Location véhicule ONG RDC | 4x4 mission humanitaire — DRCCARS",
    h1: "Location véhicule pour ONG",
    description:
      "Location véhicule ONG et voiture pour missions humanitaires en RDC. 4x4 et utilitaires — Kinshasa, Goma, Lubumbashi.",
    keywords: [
      "location véhicule ONG",
      "location voiture ONG",
      "location 4x4 ONG",
      "véhicule ONG RDC",
    ],
    body: "Les ONG louent des véhicules fiables via DRCCARS pour leurs missions en RDC. Contactez les propriétaires et convenez des dates.",
    carsQuery: "listingType=rent",
    related: [
      { href: "/location-voiture/pour/ong", label: "Page ONG" },
      { href: "/rent?event=corporate", label: "Locations entreprise / ONG" },
    ],
  },
  {
    slug: "location-voiture-mariage",
    title: "Location voiture mariage RDC | Voiture de location mariage — DRCCARS",
    h1: "Location voiture mariage",
    description:
      "Location voiture mariage en RDC. Voiture de location pour mariages à Kinshasa, Goma, Lubumbashi.",
    keywords: ["location voiture mariage", "voiture de location mariage", "location véhicule mariage"],
    body: "Pour votre mariage, louez une voiture élégante via les annonces DRCCARS — contact direct avec le propriétaire.",
    carsQuery: "listingType=rent",
    related: [{ href: "/location-voiture/pour/mariage", label: "Mariages — location" }],
  },
  // —— English phrase landings (additive; French ranking URLs untouched) ——
  {
    slug: "used-cars-drc",
    title: "Used Cars for Sale in DRC | Congo Marketplace — DRCCARS",
    h1: "Used cars for sale in the DRC",
    description:
      "Buy and sell used cars in the Democratic Republic of the Congo. Listings in Kinshasa, Goma, Lubumbashi and nationwide on DRCCARS.",
    keywords: [
      "used cars DRC",
      "used cars Congo",
      "used cars for sale DRC",
      "DRC used cars",
      "Congo used cars marketplace",
    ],
    body: "DRCCARS is the local marketplace for used cars in the DRC. Browse photos and prices, then contact sellers or book a viewing — no opaque online checkout.",
    carsQuery: "listingType=sale",
    related: [
      { href: "/voitures-a-vendre/rdc", label: "Voitures à vendre (FR)" },
      { href: "/annonces/buy-car-kinshasa", label: "Buy a car in Kinshasa" },
      { href: "/annonces/buy-car-goma", label: "Buy a car in Goma" },
      { href: "/markets", label: "Nearby countries" },
    ],
  },
  {
    slug: "buy-car-drc",
    title: "Buy a Car in DRC | Used Vehicles Congo — DRCCARS",
    h1: "Buy a car in the DRC",
    description:
      "Buy a used car in the DRC. Compare listings in Kinshasa, Goma, Lubumbashi — contact sellers on DRCCARS.",
    keywords: ["buy car DRC", "buy car Congo", "buy used car DRC", "purchase car Kinshasa"],
    body: "Looking to buy a car in the Democratic Republic of the Congo? Filter by city and budget, then meet the seller in person via DRCCARS.",
    carsQuery: "listingType=sale",
    related: [
      { href: "/acheter-voiture/rdc", label: "Acheter (FR)" },
      { href: "/guides/buy-used-car-drc", label: "English buying guide" },
    ],
  },
  {
    slug: "buy-car-kinshasa",
    title: "Buy a Car in Kinshasa | Used Cars Kinshasa DRC — DRCCARS",
    h1: "Buy a car in Kinshasa",
    description:
      "Used cars for sale in Kinshasa, DRC. Prado, Hilux, Corolla and more — contact local sellers on DRCCARS.",
    keywords: [
      "buy car Kinshasa",
      "used cars Kinshasa",
      "cars for sale Kinshasa",
      "Kinshasa car marketplace",
    ],
    body: "Kinshasa buyers compare local listings on DRCCARS: clear photos, price, and direct WhatsApp/phone contact with the seller.",
    carsQuery: "listingType=sale&province=Kinshasa",
    related: [
      { href: "/voitures-a-vendre/kinshasa", label: "Voitures Kinshasa (FR)" },
      { href: "/voitures/toyota/prado/kinshasa", label: "Prado Kinshasa" },
      { href: "/markets/congo-brazzaville", label: "Buyers from Congo-Brazzaville" },
    ],
  },
  {
    slug: "buy-car-goma",
    title: "Buy a Car in Goma | Used Cars Goma Nord-Kivu — DRCCARS",
    h1: "Buy a car in Goma",
    description:
      "Used cars for sale in Goma (North Kivu). 4x4, Hilux, Prado — local DRC listings on DRCCARS.",
    keywords: ["buy car Goma", "used cars Goma", "cars for sale Goma", "Goma car market"],
    body: "Goma and North Kivu buyers find local stock on DRCCARS — ideal if you are in Rwanda or Uganda and prefer to inspect a vehicle across the border.",
    carsQuery: "listingType=sale&province=Goma",
    related: [
      { href: "/voitures-a-vendre/goma", label: "Voitures Goma (FR)" },
      { href: "/voitures/toyota/hilux/goma", label: "Hilux Goma" },
      { href: "/markets/rwanda", label: "Buyers from Rwanda" },
      { href: "/markets/uganda", label: "Buyers from Uganda" },
    ],
  },
  {
    slug: "buy-car-lubumbashi",
    title: "Buy a Car in Lubumbashi | Used Cars Haut-Katanga — DRCCARS",
    h1: "Buy a car in Lubumbashi",
    description:
      "Used cars for sale in Lubumbashi, DRC. Local marketplace listings — contact sellers on DRCCARS.",
    keywords: ["buy car Lubumbashi", "used cars Lubumbashi", "cars for sale Lubumbashi"],
    body: "Lubumbashi and Haut-Katanga listings on DRCCARS. Useful for buyers near the Zambia border who want to view a car in the DRC first.",
    carsQuery: "listingType=sale&province=Lubumbashi",
    related: [
      { href: "/voitures-a-vendre/lubumbashi", label: "Voitures Lubumbashi (FR)" },
      { href: "/markets/zambia", label: "Buyers from Zambia" },
    ],
  },
  {
    slug: "cars-for-sale-near-me-drc",
    title: "Cars for Sale Near Me in DRC | Local Listings — DRCCARS",
    h1: "Cars for sale near you in the DRC",
    description:
      "Find cars for sale near you in the DRC. City filters for Kinshasa, Goma, Lubumbashi and more on DRCCARS.",
    keywords: [
      "cars for sale near me DRC",
      "used cars near me Congo",
      "car marketplace DRC",
      "local used cars Congo",
    ],
    body: "“Near me” in the DRC means your city. Pick Kinshasa, Goma, Lubumbashi or another town, then contact the seller for a viewing.",
    carsQuery: "listingType=sale",
    related: [
      { href: "/voitures-a-vendre", label: "Browse by city (FR)" },
      { href: "/annonces/used-cars-drc", label: "Used cars DRC" },
    ],
  },
  {
    slug: "sell-car-drc",
    title: "Sell Your Car in DRC | Free Listing — DRCCARS",
    h1: "Sell your car in the DRC",
    description:
      "Sell a used car in the DRC. Free listing with photos — reach buyers in Kinshasa, Goma, Lubumbashi on DRCCARS.",
    keywords: ["sell car DRC", "sell my car Congo", "list car for sale Kinshasa", "sell car Goma"],
    body: "Post your car on DRCCARS with photos and price. Buyers message you directly — no platform payment required.",
    carsQuery: "listingType=sale",
    related: [
      { href: "/dashboard/cars/new", label: "List a car" },
      { href: "/guides/vendre-voiture-rdc", label: "Guide vente (FR)" },
    ],
  },
];

const BY_SLUG = new Map(SEO_PHRASE_PAGES.map((p) => [p.slug, p]));

export function getSeoPhrase(slug: string): SeoPhrasePage | undefined {
  return BY_SLUG.get(slug);
}

export function allSeoPhraseSlugs(): string[] {
  return SEO_PHRASE_PAGES.map((p) => p.slug);
}

export function seoPhraseCanonical(slug: string): string {
  return `${SITE_URL}/annonces/${slug}`;
}
