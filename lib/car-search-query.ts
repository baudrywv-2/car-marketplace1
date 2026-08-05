import { COMMON_MAKES, OTHER_MAKE } from "@/lib/constants";

export const PRICE_RANGES = [
  { key: "priceUnder1000" as const, min: 0, max: 1000 },
  { key: "price1000to5000" as const, min: 1000, max: 5000 },
  { key: "price5000to10000" as const, min: 5000, max: 10000 },
  { key: "priceOver10000" as const, min: 10000, max: Infinity },
];

export const DISCOUNT_RANGES = [
  { key: "discount10" as const, min: 10 },
  { key: "discount20" as const, min: 20 },
  { key: "discount30" as const, min: 30 },
];

export type CarSearchFilters = {
  q?: string;
  make?: string;
  model?: string;
  province?: string;
  type?: string;
  priceRange?: string;
  discountRange?: string;
  transmission?: string;
  fuelType?: string;
  minPrice?: string;
  maxPrice?: string;
  listingType?: "" | "sale" | "rent";
  minYear?: string;
  maxYear?: string;
  condition?: string;
  sort?: "newest" | "priceLow" | "priceHigh";
};

export type SavedSearchData = CarSearchFilters & {
  keyword?: string;
};

/** eslint-disable @typescript-eslint/no-explicit-any — Supabase query builder is chained dynamically */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyCarFilters(query: any, filters: CarSearchFilters) {
  let q = query;

  if (filters.listingType === "sale") {
    q = q.or("listing_type.eq.sale,listing_type.eq.both");
  }
  if (filters.listingType === "rent") {
    q = q.or("listing_type.eq.rent,listing_type.eq.both");
  }

  const keyword = (filters.q || "").trim();
  if (keyword) {
    const k = keyword.replace(/\*/g, "\\*").replace(/_/g, "\\_");
    const raw = `*${k}*`;
    const pat = raw.includes(",") ? `"${raw.replace(/"/g, '\\"')}"` : raw;
    q = q.or(`title.ilike.${pat},make.ilike.${pat},model.ilike.${pat},description.ilike.${pat}`);
  }

  if (filters.make) {
    if (filters.make === OTHER_MAKE) {
      q = q.or(
        `make.is.null,make.not.in.(${COMMON_MAKES.map((m) => `"${m}"`).join(",")})`
      );
    } else {
      q = q.eq("make", filters.make);
    }
  }

  if (filters.model?.trim()) {
    q = q.ilike("model", filters.model.trim());
  }

  if (filters.province) q = q.eq("province", filters.province);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.transmission) q = q.eq("transmission", filters.transmission);
  if (filters.condition === "new" || filters.condition === "used") {
    q = q.eq("condition", filters.condition);
  }

  if (filters.fuelType === "electric-hybrid") {
    q = q.in("fuel_type", ["electric", "hybrid"]);
  } else if (filters.fuelType) {
    q = q.eq("fuel_type", filters.fuelType);
  }

  const minVal = filters.minPrice
    ? parseFloat(String(filters.minPrice).replace(/,/g, ""))
    : NaN;
  const maxVal = filters.maxPrice
    ? parseFloat(String(filters.maxPrice).replace(/,/g, ""))
    : NaN;
  if (!isNaN(minVal) && minVal > 0) q = q.gte("price", minVal);
  if (!isNaN(maxVal) && maxVal > 0) q = q.lte("price", maxVal);

  if (filters.priceRange) {
    const r = PRICE_RANGES.find((x) => x.key === filters.priceRange);
    if (r) {
      q = q.gte("price", r.min);
      if (r.max !== Infinity) q = q.lt("price", r.max);
    }
  }

  if (filters.discountRange) {
    const d = DISCOUNT_RANGES.find((x) => x.key === filters.discountRange);
    if (d) q = q.gte("discount_percent", d.min);
  }

  const minYear = filters.minYear ? parseInt(filters.minYear, 10) : NaN;
  const maxYear = filters.maxYear ? parseInt(filters.maxYear, 10) : NaN;
  if (!isNaN(minYear) && minYear > 1900) q = q.gte("year", minYear);
  if (!isNaN(maxYear) && maxYear > 1900) q = q.lte("year", maxYear);

  return q;
}

export function filtersFromSearchParams(sp: {
  get: (key: string) => string | null;
}): CarSearchFilters {
  const listingTypeParam = sp.get("listingType");
  const sortParam = sp.get("sort");
  return {
    q: sp.get("q") ?? "",
    make: sp.get("make") ?? "",
    model: sp.get("model") ?? "",
    province: sp.get("province") ?? "",
    type: sp.get("type") ?? "",
    priceRange: sp.get("priceRange") ?? "",
    discountRange: sp.get("discountRange") ?? "",
    transmission: sp.get("transmission") ?? "",
    fuelType: sp.get("fuelType") ?? "",
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
    listingType:
      listingTypeParam === "sale" || listingTypeParam === "rent"
        ? listingTypeParam
        : "",
    minYear: sp.get("minYear") ?? "",
    maxYear: sp.get("maxYear") ?? "",
    condition: sp.get("condition") ?? "",
    sort:
      sortParam === "priceLow" || sortParam === "priceHigh" || sortParam === "newest"
        ? sortParam
        : "newest",
  };
}

export function filtersToSearchParams(filters: CarSearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const values: Record<string, string | undefined> = {
    q: filters.q?.trim(),
    make: filters.make,
    model: filters.model,
    province: filters.province,
    type: filters.type,
    priceRange: filters.priceRange,
    discountRange: filters.discountRange,
    transmission: filters.transmission,
    fuelType: filters.fuelType,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    listingType: filters.listingType,
    minYear: filters.minYear,
    maxYear: filters.maxYear,
    condition: filters.condition,
    sort: filters.sort && filters.sort !== "newest" ? filters.sort : undefined,
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

export function hasAnyCarFilter(f: CarSearchFilters): boolean {
  return !!(
    f.q?.trim() ||
    f.make ||
    f.model ||
    f.province ||
    f.type ||
    f.priceRange ||
    f.discountRange ||
    f.transmission ||
    f.fuelType ||
    f.minPrice ||
    f.maxPrice ||
    f.listingType ||
    f.minYear ||
    f.maxYear ||
    f.condition
  );
}
