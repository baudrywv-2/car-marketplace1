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

/**
 * Extra on-page copy for SEO landings. Additive only — does not change titles/H1s.
 * Keep paragraphs factual and location-specific to avoid thin duplicates.
 */
export function locationGuideParagraphs(
  location: SeoLocation,
  intent: "vente" | "acheter"
): string[] {
  const n = location.name;
  const region = location.region;

  if (location.kind === "national") {
    return intent === "vente"
      ? [
          "Sur DRCCARS, les annonces de vente sont publiées par des particuliers et des vendeurs locaux. Filtrez par ville, marque, budget, puis contactez le vendeur ou demandez un rendez-vous — le paiement et la transaction se font hors plateforme.",
          "Les pages par ville (Kinshasa, Goma, Lubumbashi, Bukavu…) regroupent les occasions et véhicules utiles pour comparer avant de vous déplacer.",
        ]
      : [
          "Pour acheter en RDC, commencez par les annonces vérifiées sur DRCCARS : prix affiché, photos, ville, puis échangez directement avec le vendeur. Pas de paiement en ligne sur la marketplace.",
          "Utilisez les pages par ville pour cibler Kinshasa, Goma, Lubumbashi ou votre province, puis ouvrez les fiches détaillées pour le kilométrage, l’année et les contacts.",
        ];
  }

  if (location.kind === "province") {
    return intent === "vente"
      ? [
          `Les annonces en ${n} couvrent les villes et axes de cette province. Vérifiez la localisation exacte sur chaque fiche avant un déplacement.`,
          `Vous vendez en ${n} ? Publiez gratuitement avec photos claires, prix et numéro WhatsApp pour répondre vite aux acheteurs.`,
        ]
      : [
          `Acheter en ${n} : comparez plusieurs annonces de la province, demandez l’historique du véhicule et privilégiez un rendez-vous sur place.`,
          `DRCCARS affiche le contact du vendeur (téléphone / WhatsApp) pour organiser la visite dans ${n}.`,
        ];
  }

  // City-specific notes for major markets (unique content, stable wording).
  const cityNotes: Record<string, { vente: string[]; acheter: string[] }> = {
    kinshasa: {
      vente: [
        "À Kinshasa, les demandes portent souvent sur berlines, SUV et véhicules de ville. Indiquez clairement la commune ou le quartier sur l’annonce pour faciliter les rendez-vous.",
        "Comparez plusieurs offres Kinshasa sur DRCCARS, puis contactez le vendeur pour voir le véhicule avant tout engagement.",
      ],
      acheter: [
        "Pour acheter à Kinshasa, filtrez par budget et type (berline, SUV, utilitaire), puis demandez un RDV dans la commune du vendeur.",
        "Vérifiez les papiers et l’état du véhicule sur place — DRCCARS met en relation, sans paiement intégré.",
      ],
    },
    goma: {
      vente: [
        "À Goma (Nord-Kivu), les 4x4, pick-up et véhicules adaptés aux routes locales sont très recherchés. Précisez l’état, le kilométrage et la disponibilité pour un essai.",
        "Les annonces Goma sur DRCCARS aident acheteurs et vendeurs à se trouver sans passer par des groupes saturés.",
      ],
      acheter: [
        "Acheter à Goma : regardez surtout transmission, garde au sol et entretien. Contactez le vendeur via WhatsApp pour fixer un essai.",
        "Les pages voitures à vendre à Goma et location véhicule complètent l’achat si vous avez besoin d’un véhicule temporaire.",
      ],
    },
    lubumbashi: {
      vente: [
        "À Lubumbashi (Haut-Katanga), berlines, SUV et utilitaires circulent beaucoup. Une annonce avec prix net et plusieurs photos attire plus de contacts sérieux.",
        "Publiez ou parcourez les occasions Lubumbashi sur DRCCARS, puis organisez la visite directement avec le vendeur.",
      ],
      acheter: [
        "Pour acheter à Lubumbashi, comparez prix et année, puis confirmez la disponibilité avant de vous déplacer.",
        "DRCCARS centralise les annonces locales pour éviter de chercher uniquement sur les réseaux sociaux.",
      ],
    },
    bukavu: {
      vente: [
        "À Bukavu (Sud-Kivu), précisez si le véhicule est adapté à la ville et aux trajets vers l’intérieur. Photos récentes et prix clair accélèrent les échanges.",
        "Les acheteurs Bukavu trouvent les annonces vente et occasion sur DRCCARS, avec contact direct vendeur.",
      ],
      acheter: [
        "Acheter à Bukavu : ciblez les annonces locales, demandez un RDV et vérifiez les documents du véhicule sur place.",
        "Utilisez aussi la page voitures à vendre Bukavu pour élargir la comparaison avant d’acheter.",
      ],
    },
  };

  const specific = cityNotes[location.slug];
  if (specific) return intent === "vente" ? specific.vente : specific.acheter;

  return intent === "vente"
    ? [
        `À ${n}${region ? ` (${region})` : ""}, publiez ou consultez des voitures d’occasion avec photos, prix et contact. Les acheteurs locaux filtrent souvent par budget et type de véhicule.`,
        `Sur DRCCARS, chaque annonce ${n} permet d’écrire ou d’appeler le vendeur, ou de demander un rendez-vous — sans achat en ligne.`,
      ]
    : [
        `Pour acheter une voiture à ${n}${region ? ` (${region})` : ""}, parcourez les annonces, comparez prix et année, puis contactez le vendeur pour une visite.`,
        `DRCCARS reste une vitrine locale : la négociation et le paiement se font entre vous et le vendeur.`,
      ];
}
