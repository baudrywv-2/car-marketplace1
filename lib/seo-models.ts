import { getSeoLocation, type SeoLocation } from "@/lib/seo-locations";

export type SeoCarModel = {
  makeSlug: string;
  modelSlug: string;
  make: string;
  modelLabel: string;
  /** ilike patterns for cars.model (and title fallback) */
  modelPatterns: string[];
  keywords: string[];
};

export const SEO_CAR_MODELS: SeoCarModel[] = [
  {
    makeSlug: "toyota",
    modelSlug: "prado",
    make: "Toyota",
    modelLabel: "Prado",
    modelPatterns: ["%prado%"],
    keywords: ["prado", "toyota prado", "land cruiser prado", "prado occasion"],
  },
  {
    makeSlug: "toyota",
    modelSlug: "hilux",
    make: "Toyota",
    modelLabel: "Hilux",
    modelPatterns: ["%hilux%"],
    keywords: ["hilux", "toyota hilux", "pick-up hilux"],
  },
  {
    makeSlug: "toyota",
    modelSlug: "land-cruiser",
    make: "Toyota",
    modelLabel: "Land Cruiser",
    modelPatterns: ["%land cruiser%", "%landcruiser%", "%txl%", "%vx%"],
    keywords: ["land cruiser", "toyota land cruiser", "txl", "4x4"],
  },
  {
    makeSlug: "toyota",
    modelSlug: "noah",
    make: "Toyota",
    modelLabel: "Noah",
    modelPatterns: ["%noah%"],
    keywords: ["noah", "toyota noah", "minibus noah"],
  },
  {
    makeSlug: "toyota",
    modelSlug: "rav4",
    make: "Toyota",
    modelLabel: "RAV4",
    modelPatterns: ["%rav4%", "%rav 4%"],
    keywords: ["rav4", "toyota rav4", "suv rav4"],
  },
  {
    makeSlug: "toyota",
    modelSlug: "corolla",
    make: "Toyota",
    modelLabel: "Corolla",
    modelPatterns: ["%corolla%"],
    keywords: ["corolla", "toyota corolla", "berline corolla"],
  },
];

/** Cities for make/model hubs (subset of SEO cities + national). */
export const SEO_MODEL_CITY_SLUGS = ["rdc", "kinshasa", "goma", "lubumbashi", "bukavu"] as const;

export type SeoModelCitySlug = (typeof SEO_MODEL_CITY_SLUGS)[number];

export function getSeoCarModel(makeSlug: string, modelSlug: string): SeoCarModel | undefined {
  return SEO_CAR_MODELS.find((m) => m.makeSlug === makeSlug && m.modelSlug === modelSlug);
}

export function allSeoModelCityParams(): { make: string; model: string; city: string }[] {
  const out: { make: string; model: string; city: string }[] = [];
  for (const m of SEO_CAR_MODELS) {
    for (const city of SEO_MODEL_CITY_SLUGS) {
      out.push({ make: m.makeSlug, model: m.modelSlug, city });
    }
  }
  return out;
}

export function seoModelPath(model: SeoCarModel, citySlug: string): string {
  return `/voitures/${model.makeSlug}/${model.modelSlug}/${citySlug}`;
}

export function seoModelBrowseHref(model: SeoCarModel, location: SeoLocation): string {
  const params = new URLSearchParams();
  params.set("listingType", "sale");
  params.set("make", model.make);
  // Substring match — listings often store "Land Cruiser Prado", not bare "Prado".
  params.set("model", `%${model.modelLabel}%`);
  if (location.kind === "city" || location.kind === "province") {
    if (location.carsQuery.includes("province=")) {
      params.set("province", location.name);
    } else if (location.kind === "city") {
      // Keep city intent without wiping make/model filters.
      params.set("q", location.name);
    }
  }
  return `/cars?${params.toString()}`;
}

export function seoModelTitle(model: SeoCarModel, location: SeoLocation): string {
  if (location.kind === "national") {
    return `${model.make} ${model.modelLabel} à vendre en RDC | Occasion — DRCCARS`;
  }
  return `${model.make} ${model.modelLabel} ${location.name} | À vendre occasion — DRCCARS`;
}

export function seoModelH1(model: SeoCarModel, location: SeoLocation): string {
  if (location.kind === "national") {
    return `${model.make} ${model.modelLabel} à vendre en RDC`;
  }
  return `${model.make} ${model.modelLabel} à vendre à ${location.name}`;
}

export function seoModelDescription(model: SeoCarModel, location: SeoLocation): string {
  if (location.kind === "national") {
    return `${model.make} ${model.modelLabel} d'occasion en RDC. Annonces locales à Kinshasa, Goma, Lubumbashi — contactez les vendeurs sur DRCCARS.`;
  }
  return `${model.make} ${model.modelLabel} à vendre à ${location.name}${location.region ? ` (${location.region})` : ""}. Occasions sur DRCCARS — photos, prix, contact vendeur.`;
}

export function seoModelKeywords(model: SeoCarModel, location: SeoLocation): string[] {
  const n = location.name;
  const place = location.kind === "national" ? "DRC" : n;
  return [
    ...model.keywords.map((k) => (location.kind === "national" ? `${k} RDC` : `${k} ${n}`)),
    `${model.make} ${model.modelLabel} ${n}`,
    `acheter ${model.modelLabel} ${n}`,
    // English long-tails (metadata only — French H1/title unchanged)
    `buy ${model.modelLabel} ${place}`,
    `used ${model.make} ${model.modelLabel} ${place}`,
    `${model.modelLabel} for sale ${place}`,
  ];
}

export function seoModelIntro(model: SeoCarModel, location: SeoLocation): string[] {
  const label = `${model.make} ${model.modelLabel}`;
  if (location.kind === "national") {
    return [
      `Parcourez les annonces ${label} d'occasion en République Démocratique du Congo. Comparez prix et photos, puis contactez le vendeur ou demandez un rendez-vous sur DRCCARS.`,
      `Les pages par ville (Kinshasa, Goma, Lubumbashi, Bukavu) aident à cibler un ${model.modelLabel} près de chez vous — sans passer par un importateur Japon si le stock local convient.`,
    ];
  }
  return [
    `Annonces ${label} à ${location.name}${location.region ? ` (${location.region})` : ""}. Vérifiez l'année, le kilométrage et l'état sur chaque fiche avant de vous déplacer.`,
    `DRCCARS connecte acheteurs et vendeurs locaux : pas de paiement en ligne, contact direct (téléphone / WhatsApp) pour un essai.`,
  ];
}

export function resolveSeoModelLocation(citySlug: string): SeoLocation | undefined {
  return getSeoLocation(citySlug);
}
