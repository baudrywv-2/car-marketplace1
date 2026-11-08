import { DRC_LOCATIONS } from "@/lib/constants";
import { DRC_PROVINCES } from "@/lib/drc-provinces";

export type SeoLocationKind = "city" | "province" | "national";

export type SeoLocation = {
  slug: string;
  name: string;
  kind: SeoLocationKind;
  /** Province name when kind is city (for copy). */
  region?: string;
  /** Query used on /cars for sale listings. */
  carsQuery: string;
};

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Major DRC cities for vente / acheter SEO coverage. */
const CITY_DEFS: { name: string; region: string }[] = [
  { name: "Kinshasa", region: "Kinshasa" },
  { name: "Lubumbashi", region: "Haut-Katanga" },
  { name: "Goma", region: "Nord-Kivu" },
  { name: "Bukavu", region: "Sud-Kivu" },
  { name: "Kisangani", region: "Tshopo" },
  { name: "Beni", region: "Nord-Kivu" },
  { name: "Butembo", region: "Nord-Kivu" },
  { name: "Uvira", region: "Sud-Kivu" },
  { name: "Kolwezi", region: "Lualaba" },
  { name: "Mbuji-Mayi", region: "Kasaï-Oriental" },
  { name: "Kananga", region: "Kasaï-Central" },
  { name: "Matadi", region: "Kongo Central" },
  { name: "Bunia", region: "Ituri" },
  { name: "Kindu", region: "Maniema" },
  { name: "Bandundu", region: "Kwilu" },
  { name: "Kikwit", region: "Kwilu" },
  { name: "Gemena", region: "Sud-Ubangi" },
  { name: "Mbandaka", region: "Équateur" },
  { name: "Kalemie", region: "Tanganyika" },
  { name: "Isiro", region: "Haut-Uélé" },
  { name: "Likasi", region: "Haut-Katanga" },
  { name: "Tshikapa", region: "Kasaï" },
  { name: "Mwene-Ditu", region: "Lomami" },
  { name: "Boma", region: "Kongo Central" },
  { name: "Gbadolite", region: "Nord-Ubangi" },
  { name: "Boende", region: "Tshuapa" },
  { name: "Inongo", region: "Mai-Ndombe" },
  { name: "Kenge", region: "Kwango" },
  { name: "Lisala", region: "Mongala" },
  { name: "Kabinda", region: "Lomami" },
  { name: "Kamina", region: "Haut-Lomami" },
  { name: "Buta", region: "Bas-Uélé" },
];

export const SEO_NATIONAL: SeoLocation = {
  slug: "rdc",
  name: "RDC",
  kind: "national",
  carsQuery: "listingType=sale",
};

export const SEO_CITIES: SeoLocation[] = CITY_DEFS.map(({ name, region }) => {
  const usesProvinceChip = (DRC_LOCATIONS as readonly string[]).includes(name);
  return {
    slug: slugify(name),
    name,
    kind: "city" as const,
    region,
    // Main filter chips store city names in `province`; other cities match via keyword search.
    carsQuery: usesProvinceChip
      ? `listingType=sale&province=${encodeURIComponent(name)}`
      : `listingType=sale&q=${encodeURIComponent(name)}`,
  };
});

export const SEO_PROVINCES: SeoLocation[] = DRC_PROVINCES.map((name) => ({
  slug: slugify(name),
  name,
  kind: "province" as const,
  carsQuery: `listingType=sale&province=${encodeURIComponent(name)}`,
}));

/** Prefer city pages when a slug collides with a province (e.g. Kinshasa). */
function uniqueBySlug(list: SeoLocation[]): SeoLocation[] {
  const map = new Map<string, SeoLocation>();
  for (const loc of list) {
    if (!map.has(loc.slug)) map.set(loc.slug, loc);
  }
  return [...map.values()];
}

export const SEO_LOCATIONS: SeoLocation[] = uniqueBySlug([
  SEO_NATIONAL,
  ...SEO_CITIES,
  ...SEO_PROVINCES,
]);

const BY_SLUG = new Map(SEO_LOCATIONS.map((l) => [l.slug, l]));

export function getSeoLocation(slug: string): SeoLocation | undefined {
  return BY_SLUG.get(slug);
}

export function allSeoLocationSlugs(): string[] {
  return SEO_LOCATIONS.map((l) => l.slug);
}

export function carsBrowseHref(location: SeoLocation): string {
  return `/cars?${location.carsQuery}`;
}

/** Autofill / Suggest-style phrases buyers type in Google. */
export function locationAutofillPhrases(location: SeoLocation): string[] {
  const n = location.name;
  if (location.kind === "national") {
    return [
      "voiture RDC",
      "voiture d'occasion RDC",
      "voiture d'occasion à vendre",
      "voiture occasion a vendre",
      "voitures à vendre en RDC",
      "vente voiture occasion RDC",
      "vente de voiture d'occasion en RDC",
      "véhicule à vendre RDC",
      "acheter voiture RDC",
      "agence vente voiture RDC",
    ];
  }
  return [
    `voiture ${n}`,
    `voitures ${n}`,
    `voiture à vendre ${n}`,
    `voiture occasion ${n}`,
    `voiture d'occasion ${n}`,
    `véhicule à vendre ${n}`,
    `acheter voiture ${n}`,
    `vente voiture ${n}`,
    `agence vente voiture ${n}`,
  ];
}

export function venteTitle(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Voiture d'occasion à vendre en RDC | Vente voiture occasion — DRCCARS";
  }
  if (location.kind === "province") {
    return `Voiture ${location.name} | Voitures à vendre ${location.name} — DRCCARS`;
  }
  // Beat dealer/classified titles: short autofill + marketplace intent
  if (location.slug === "goma") {
    return "Voiture Goma | Voitures à vendre à Goma Nord-Kivu | Occasion & 4x4 — DRCCARS";
  }
  if (location.slug === "kinshasa") {
    return "Voiture Kinshasa | Voitures à vendre Kinshasa | Occasion RDC — DRCCARS";
  }
  return `Voiture ${location.name} | Voiture à vendre ${location.name} | Occasion — DRCCARS`;
}

export function venteDescription(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Voiture d'occasion à vendre en RDC. Vente de voitures et véhicules à Kinshasa, Goma, Lubumbashi. Marketplace DRCCARS — contactez les vendeurs.";
  }
  if (location.kind === "province") {
    return `Voiture ${location.name} : véhicules et voitures d'occasion à vendre en ${location.name} (RDC). Annonces sur DRCCARS.`;
  }
  return `Voiture ${location.name} — voiture à vendre à ${location.name}${location.region ? ` (${location.region})` : ""}, occasion et véhicule à vendre. Trouvez les annonces sur DRCCARS.`;
}

export function acheterTitle(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Acheter voiture RDC | Voiture d'occasion à vendre — DRCCARS";
  }
  if (location.kind === "province") {
    return `Acheter voiture ${location.name} | Voiture ${location.name} occasion — DRCCARS`;
  }
  return `Acheter voiture ${location.name} | Voiture ${location.name} — DRCCARS`;
}

export function acheterDescription(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Acheter une voiture d'occasion en RDC. Voiture Kinshasa, voiture Goma, voiture Lubumbashi et plus — annonces sur DRCCARS.";
  }
  if (location.kind === "province") {
    return `Acheter voiture ${location.name} : véhicules d'occasion en ${location.name}. Contactez les vendeurs sur DRCCARS.`;
  }
  return `Acheter voiture ${location.name} — voiture ${location.name}, occasion à vendre${location.region ? ` (${location.region})` : ""}. Annonces DRCCARS.`;
}

export function venteH1(location: SeoLocation): string {
  if (location.kind === "national") return "Voiture d'occasion à vendre en RDC";
  if (location.kind === "province") return `Voiture ${location.name} — à vendre`;
  return `Voiture ${location.name}`;
}

export function acheterH1(location: SeoLocation): string {
  if (location.kind === "national") return "Acheter une voiture en RDC";
  if (location.kind === "province") return `Acheter voiture ${location.name}`;
  return `Acheter voiture ${location.name}`;
}

export function voitureShortTitle(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Voiture RDC | Voiture d'occasion à vendre — DRCCARS";
  }
  return `Voiture ${location.name} | Voiture à vendre ${location.name} — DRCCARS`;
}

export function voitureShortDescription(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Voiture RDC : voiture d'occasion à vendre, véhicule à vendre à Kinshasa, Goma, Lubumbashi. Marketplace DRCCARS.";
  }
  return `Voiture ${location.name} : annonces de voiture à vendre, occasion et véhicule à ${location.name}. DRCCARS.`;
}

export function voitureShortH1(location: SeoLocation): string {
  if (location.kind === "national") return "Voiture RDC";
  return `Voiture ${location.name}`;
}
