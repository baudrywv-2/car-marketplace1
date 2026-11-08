import { DRC_LOCATIONS } from "@/lib/constants";
import { SEO_CITIES, SEO_NATIONAL, SEO_PROVINCES, type SeoLocation } from "@/lib/seo-locations";

export type SeoRentEvent = {
  slug: string;
  /** Maps to /rent?event= — empty = all rentals */
  eventParam: "" | "wedding" | "tourism" | "corporate" | "airport" | "private";
  nameFr: string;
  titleHint: string;
  keywords: string[];
};

/** Event / use-case landings for location (incl. ONG, voyage, mariage…). */
export const SEO_RENT_EVENTS: SeoRentEvent[] = [
  {
    slug: "tout-evenement",
    eventParam: "",
    nameFr: "tout événement",
    titleHint: "Voiture de location pour tout événement",
    keywords: [
      "voiture de location pour tout événement",
      "voiture location événement",
      "véhicule de location événement",
      "location voiture événement RDC",
    ],
  },
  {
    slug: "mariage",
    eventParam: "wedding",
    nameFr: "mariages",
    titleHint: "Location voiture mariage",
    keywords: [
      "location voiture mariage",
      "voiture de location mariage",
      "location véhicule mariage RDC",
      "voiture mariage Kinshasa",
      "voiture mariage Goma",
    ],
  },
  {
    slug: "voyage",
    eventParam: "tourism",
    nameFr: "voyage",
    titleHint: "Location voiture voyage",
    keywords: [
      "location voiture voyage",
      "voiture de location voyage",
      "véhicule location voyage",
      "agence location voyage",
      "agence de vente voyage",
    ],
  },
  {
    slug: "tourisme",
    eventParam: "tourism",
    nameFr: "tourisme",
    titleHint: "Location voiture tourisme",
    keywords: [
      "location voiture tourisme",
      "voiture tourisme RDC",
      "location véhicule tourisme",
      "4x4 location tourisme",
    ],
  },
  {
    slug: "ong",
    eventParam: "corporate",
    nameFr: "ONG",
    titleHint: "Location véhicule ONG",
    keywords: [
      "location véhicule ONG",
      "location voiture ONG",
      "location 4x4 ONG RDC",
      "véhicule pour ONG",
      "location auto humanitaire",
    ],
  },
  {
    slug: "entreprise",
    eventParam: "corporate",
    nameFr: "entreprises",
    titleHint: "Location voiture entreprise",
    keywords: [
      "location voiture entreprise",
      "location véhicule société",
      "location auto corporate RDC",
    ],
  },
  {
    slug: "aeroport",
    eventParam: "airport",
    nameFr: "aéroport / transfert",
    titleHint: "Location voiture aéroport",
    keywords: [
      "location voiture aéroport",
      "transfert aéroport voiture",
      "location véhicule aéroport Kinshasa",
      "location voiture aéroport Goma",
    ],
  },
  {
    slug: "privee",
    eventParam: "private",
    nameFr: "location privée",
    titleHint: "Location voiture privée",
    keywords: ["location voiture privée", "louer voiture particulière RDC"],
  },
];

const EVENT_BY_SLUG = new Map(SEO_RENT_EVENTS.map((e) => [e.slug, e]));

export function getSeoRentEvent(slug: string): SeoRentEvent | undefined {
  return EVENT_BY_SLUG.get(slug);
}

export function allSeoRentEventSlugs(): string[] {
  return SEO_RENT_EVENTS.map((e) => e.slug);
}

export const SEO_RENT_LOCATIONS: SeoLocation[] = [SEO_NATIONAL, ...SEO_CITIES, ...SEO_PROVINCES];

export function rentBrowseHref(location: SeoLocation, event?: SeoRentEvent): string {
  const params = new URLSearchParams();
  if (location.kind === "city") {
    const usesChip = (DRC_LOCATIONS as readonly string[]).includes(location.name);
    if (usesChip) params.set("province", location.name);
    else params.set("q", location.name);
  } else if (location.kind === "province") {
    params.set("province", location.name);
  }
  if (event?.eventParam) params.set("event", event.eventParam);
  const qs = params.toString();
  return qs ? `/rent?${qs}` : "/rent";
}

export function rentLocationTitle(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Location voiture RDC | Véhicule de location tout événement — DRCCARS";
  }
  return `Location voiture ${location.name} | Véhicule de location ${location.name} — DRCCARS`;
}

export function rentLocationDescription(location: SeoLocation): string {
  if (location.kind === "national") {
    return "Location de voiture et véhicule en RDC pour mariages, voyage, tourisme, ONG, entreprises et tout événement. Kinshasa, Goma, Lubumbashi — DRCCARS.";
  }
  return `Location voiture ${location.name} : véhicule de location pour mariage, voyage, tourisme, ONG et événements. Annonces sur DRCCARS.`;
}

export function rentLocationH1(location: SeoLocation): string {
  if (location.kind === "national") return "Location voiture & véhicule en RDC";
  return `Location voiture ${location.name}`;
}

export function rentLocationKeywords(location: SeoLocation): string[] {
  const n = location.name;
  if (location.kind === "national") {
    return [
      "location voiture RDC",
      "location véhicule RDC",
      "voiture de location",
      "véhicule de location",
      "voiture de location pour tout événement",
      "location voiture mariage",
      "location voiture voyage",
      "location voiture tourisme",
      "location véhicule ONG",
      "location voiture Kinshasa",
      "location voiture Goma",
    ];
  }
  return [
    `location voiture ${n}`,
    `location véhicule ${n}`,
    `voiture de location ${n}`,
    `véhicule de location ${n}`,
    `louer voiture ${n}`,
    `location voiture mariage ${n}`,
    `location voiture voyage ${n}`,
  ];
}

export function rentEventTitle(event: SeoRentEvent): string {
  return `${event.titleHint} en RDC | Location véhicule — DRCCARS`;
}

export function rentEventDescription(event: SeoRentEvent): string {
  return `${event.titleHint} en RDC — Kinshasa, Goma, Lubumbashi. Louez un véhicule pour ${event.nameFr} sur DRCCARS.`;
}

export function rentEventH1(event: SeoRentEvent): string {
  return event.titleHint;
}
