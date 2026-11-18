/**
 * Neighboring-country market pages — buyers near DRC borders.
 * Ranking-safe: new URLs only; point to existing DRC city hubs.
 */
export type SeoNeighborMarket = {
  slug: string;
  name: string;
  nameLocal?: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  /** Primary DRC cities useful for that neighbor */
  borderCities: { slug: string; name: string; note: string }[];
  body: string[];
};

export const SEO_NEIGHBOR_MARKETS: SeoNeighborMarket[] = [
  {
    slug: "rwanda",
    name: "Rwanda",
    title: "Buy a Car from DRC near Rwanda | Goma Bukavu Listings — DRCCARS",
    h1: "Cars in the DRC for buyers from Rwanda",
    description:
      "Looking for a used car near Rwanda? Browse DRCCARS listings in Goma and Bukavu — inspect locally in the DRC, contact sellers directly.",
    keywords: [
      "buy car Rwanda DRC",
      "used cars Goma Rwanda",
      "cars for sale near Rwanda",
      "Goma used cars",
      "cross border car DRC Rwanda",
    ],
    borderCities: [
      { slug: "goma", name: "Goma", note: "Closest major market to Kigali / Rubavu" },
      { slug: "bukavu", name: "Bukavu", note: "South Kivu — near Cyangugu / Rusizi" },
      { slug: "beni", name: "Beni", note: "North Kivu corridor" },
    ],
    body: [
      "Many buyers in Rwanda search for 4x4s and pick-ups already in eastern DRC. DRCCARS lists local sellers in Goma and Bukavu so you can arrange a viewing instead of waiting on an overseas import.",
      "We are a DRC marketplace — not a Rwanda dealer network. You contact the seller, verify papers on site, and negotiate directly.",
    ],
  },
  {
    slug: "uganda",
    name: "Uganda",
    title: "Buy a Car from DRC near Uganda | Goma Beni Listings — DRCCARS",
    h1: "Cars in the DRC for buyers from Uganda",
    description:
      "Used cars near the Uganda–DRC corridor. Check Goma and Beni listings on DRCCARS, then contact sellers for a viewing.",
    keywords: [
      "buy car Uganda DRC",
      "used cars Goma Uganda",
      "cars for sale near Uganda",
      "Beni used cars",
      "cross border car Uganda Congo",
    ],
    borderCities: [
      { slug: "goma", name: "Goma", note: "East DRC hub linked to regional trade" },
      { slug: "beni", name: "Beni", note: "Toward the Uganda corridor" },
      { slug: "bunia", name: "Bunia", note: "Ituri — regional travel routes" },
    ],
    body: [
      "If you are in Uganda and considering a vehicle in eastern DRC, start with approved listings in Goma or Beni on DRCCARS.",
      "Confirm border and customs rules yourself; DRCCARS only connects you with the seller for the car itself.",
    ],
  },
  {
    slug: "congo-brazzaville",
    name: "Congo-Brazzaville",
    nameLocal: "République du Congo",
    title: "Buy a Car from DRC near Brazzaville | Kinshasa Listings — DRCCARS",
    h1: "Cars in Kinshasa for buyers from Congo-Brazzaville",
    description:
      "Buyers from Brazzaville / Pointe-Noire: browse used cars in Kinshasa on DRCCARS — short hop across the Congo River corridor.",
    keywords: [
      "buy car Brazzaville Kinshasa",
      "used cars Kinshasa Congo",
      "voiture Kinshasa Brazzaville",
      "cars for sale Kinshasa for Congo Brazza",
    ],
    borderCities: [
      { slug: "kinshasa", name: "Kinshasa", note: "Facing Brazzaville across the river" },
      { slug: "matadi", name: "Matadi", note: "Kongo Central logistics hub" },
      { slug: "boma", name: "Boma", note: "Atlantic corridor" },
    ],
    body: [
      "Kinshasa stock on DRCCARS is the practical starting point for buyers in Congo-Brazzaville who can travel for a viewing.",
      "Listings are in the DRC marketplace — French and English search both work; contact sellers by phone or WhatsApp.",
    ],
  },
  {
    slug: "zambia",
    name: "Zambia",
    title: "Buy a Car from DRC near Zambia | Lubumbashi Listings — DRCCARS",
    h1: "Cars in Lubumbashi for buyers from Zambia",
    description:
      "Used cars in Lubumbashi (Haut-Katanga) for buyers near Zambia. Local DRC listings on DRCCARS.",
    keywords: [
      "buy car Zambia DRC",
      "used cars Lubumbashi Zambia",
      "cars for sale Lubumbashi",
      "cross border car Zambia Congo",
    ],
    borderCities: [
      { slug: "lubumbashi", name: "Lubumbashi", note: "Main hub near the Zambia border" },
      { slug: "likasi", name: "Likasi", note: "Haut-Katanga" },
      { slug: "kolwezi", name: "Kolwezi", note: "Lualaba mining corridor" },
    ],
    body: [
      "Lubumbashi is the natural DRC market for many Zambia-side buyers. Browse DRCCARS listings, then arrange a local inspection.",
      "DRCCARS does not handle cross-border registration — focus on finding the right car and seller first.",
    ],
  },
  {
    slug: "angola",
    name: "Angola",
    title: "Buy a Car from DRC near Angola | Kinshasa Matadi Listings — DRCCARS",
    h1: "Cars in the DRC for buyers from Angola",
    description:
      "Buyers from Angola: explore used cars in Kinshasa and Matadi on DRCCARS — DRC marketplace with direct seller contact.",
    keywords: [
      "buy car Angola DRC",
      "used cars Kinshasa Angola",
      "cars for sale Matadi",
      "voiture Kinshasa Angola",
    ],
    borderCities: [
      { slug: "kinshasa", name: "Kinshasa", note: "Largest DRC inventory pool" },
      { slug: "matadi", name: "Matadi", note: "West / port corridor" },
      { slug: "boma", name: "Boma", note: "Toward the Atlantic routes" },
    ],
    body: [
      "Angolan buyers often look at Kinshasa or western DRC stock. Use DRCCARS to shortlist cars, then verify documents with the seller on site.",
      "We remain a DRC listing platform — travel and import formalities stay between you and the relevant authorities.",
    ],
  },
];

const BY_SLUG = new Map(SEO_NEIGHBOR_MARKETS.map((m) => [m.slug, m]));

export function getSeoNeighbor(slug: string): SeoNeighborMarket | undefined {
  return BY_SLUG.get(slug);
}

export function allSeoNeighborSlugs(): string[] {
  return SEO_NEIGHBOR_MARKETS.map((m) => m.slug);
}
