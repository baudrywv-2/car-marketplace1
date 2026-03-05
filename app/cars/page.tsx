"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { COMMON_MAKES, OTHER_MAKE, DRC_LOCATIONS, LISTING_TYPE_TRANSLATION_KEYS } from "@/lib/constants";
import { formatPrice, getBestRentalPrice, getRentalTiers } from "@/lib/format-utils";
import { readGuestFavorites, GUEST_FAVORITES_KEY } from "@/lib/guest-favorites";
import AdPlacement from "@/app/components/AdPlacement";
import FavoriteButton from "@/app/components/FavoriteButton";
import CarCardSkeleton from "@/app/components/CarCardSkeleton";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import CarImagePlaceholder from "@/app/components/CarImagePlaceholder";
import VerifiedSellerBadge from "@/app/components/VerifiedSellerBadge";
import LoadingFallback from "@/app/components/LoadingFallback";
import { formatListedDate } from "@/lib/date-utils";

type Car = {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  make: string;
  model: string;
  year: number | null;
  type: string | null;
  province: string | null;
  city: string | null;
  images: string[];
  currency?: string | null;
  condition?: string | null;
  discount_percent?: number | null;
  transmission?: string | null;
  fuel_type?: string | null;
  owner_id?: string;
  created_at?: string | null;
  listing_type?: string | null;
  rental_price_per_hour?: number | null;
  rental_price_per_day?: number | null;
  rental_price_per_week?: number | null;
  rental_price_per_month?: number | null;
  rental_currency?: string | null;
  rental_event_type?: string[] | null;
  is_sold?: boolean | null;
};

type Profile = { id: string; full_name: string | null; phone_verified?: boolean; id_verified?: boolean; dealer_verified?: boolean };

const PRICE_RANGES = [
  { label: "Under $1,000", min: 0, max: 1000 },
  { label: "$1,000 - $5,000", min: 1000, max: 5000 },
  { label: "$5,000 - $10,000", min: 5000, max: 10000 },
  { label: "Over $10,000", min: 10000, max: Infinity },
];

const DISCOUNT_RANGES = [
  { label: "10%+ off", min: 10 },
  { label: "20%+ off", min: 20 },
  { label: "30%+ off", min: 30 },
];

const PAGE_SIZE_OPTIONS = [24, 48, 100, 200, 300, 400, 500] as const;

function FilterBlock({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-compact p-3">
      <h3 className="mb-2 text-[10px] font-semibold tracking-tight text-[var(--foreground)]">{title}</h3>
      {children}
    </div>
  );
}

function CarsPageContent() {
  const router = useRouter();
  const { t, currency } = useLocale();
  const searchParams = useSearchParams();
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState(() => searchParams.get("q") ?? "");
  const [make, setMake] = useState(() => searchParams.get("make") ?? "");
  const [province, setProvince] = useState(() => searchParams.get("province") ?? "");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [discountRange, setDiscountRange] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") ?? "");
  const [density, setDensity] = useState<"compact" | "spacious">("compact");
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(24);
  const [visibleCount, setVisibleCount] = useState(24);
  const [savedSearches, setSavedSearches] = useState<
    { id: string; label: string; data: any }[]
  >([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "priceLow" | "priceHigh">("newest");
  const [listingType, setListingType] = useState<"" | "sale" | "rent">("");
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());

  function fisherYatesShuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  useEffect(() => {
    const interval = setInterval(() => setShuffleSeed(Date.now()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function readSavedSearches() {
    try {
      const raw = localStorage.getItem("saved-searches");
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return;
      setSavedSearches(
        parsed.filter(
          (s: any) =>
            s &&
            typeof s.id === "string" &&
            typeof s.label === "string" &&
            typeof s.data === "object"
        )
      );
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    readSavedSearches();
    try {
      const raw = localStorage.getItem("compare-cars");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setCompareIds(parsed.filter((id) => typeof id === "string").slice(0, 4));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const localIds = readGuestFavorites();
    if (!user) {
      setFavoriteIds(new Set(localIds));
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/favorites", { credentials: "include" });
        const data = await res.json();
        const serverIds = ((data.carIds ?? []) as string[]).filter(Boolean);
        const serverSet = new Set(serverIds);
        const missing = localIds.filter((id) => !serverSet.has(id));

        if (missing.length > 0) {
          const sync = await fetch("/api/favorites/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ carIds: missing }),
            credentials: "include",
          });
          if (sync.ok) localStorage.removeItem(GUEST_FAVORITES_KEY);
        } else if (localIds.length > 0) {
          localStorage.removeItem(GUEST_FAVORITES_KEY);
        }

        const merged = new Set([...serverIds, ...localIds]);
        setFavoriteIds(merged);
      } catch {
        setFavoriteIds(new Set(localIds));
      }
    })();
  }, [user]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [keyword, make, province, type, priceRange, discountRange, transmission, fuelType, minPrice, maxPrice, pageSize, listingType]);

  useEffect(() => {
    const saved = localStorage.getItem("cars-view-density");
    if (saved === "spacious" || saved === "compact") setDensity(saved);
    const savedPageSize = localStorage.getItem("cars-page-size");
    if (savedPageSize) {
      const n = parseInt(savedPageSize, 10);
      if (PAGE_SIZE_OPTIONS.includes(n as typeof PAGE_SIZE_OPTIONS[number])) {
        setPageSize(n as typeof PAGE_SIZE_OPTIONS[number]);
        setVisibleCount(n);
      }
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    const makeParam = searchParams.get("make");
    const provinceParam = searchParams.get("province");
    const minParam = searchParams.get("minPrice");
    const maxParam = searchParams.get("maxPrice");
    setKeyword(q ?? "");
    setMake(makeParam ?? "");
    setProvince(provinceParam ?? "");
    setMinPrice(minParam ?? "");
    setMaxPrice(maxParam ?? "");
  }, [searchParams]);

  function setDensityAndSave(value: "compact" | "spacious") {
    setDensity(value);
    localStorage.setItem("cars-view-density", value);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("cars")
        .select("id, title, description, price, make, model, year, type, province, city, images, currency, condition, discount_percent, transmission, fuel_type, owner_id, created_at, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_event_type, is_sold")
        .eq("is_approved", true)
        .eq("is_draft", false);

      if (listingType === "sale") query = query.or("listing_type.eq.sale,listing_type.eq.both");
      if (listingType === "rent") query = query.or("listing_type.eq.rent,listing_type.eq.both");

      if (keyword.trim()) {
        const k = keyword.trim().replace(/\*/g, "\\*").replace(/_/g, "\\_");
        const raw = `*${k}*`;
        const pat = raw.includes(",") ? `"${raw.replace(/"/g, '\\"')}"` : raw;
        query = query.or(`title.ilike.${pat},make.ilike.${pat},model.ilike.${pat},description.ilike.${pat}`);
      }
      if (make) {
        if (make === OTHER_MAKE) {
          query = query.or(`make.is.null,make.not.in.(${COMMON_MAKES.map((m) => `"${m}"`).join(",")})`);
        } else {
          query = query.eq("make", make);
        }
      }
      if (province) query = query.eq("province", province);
      if (type) query = query.eq("type", type);
      const minVal = minPrice ? parseFloat(String(minPrice).replace(/,/g, "")) : NaN;
      const maxVal = maxPrice ? parseFloat(String(maxPrice).replace(/,/g, "")) : NaN;
      if (!isNaN(minVal) && minVal > 0) query = query.gte("price", minVal);
      if (!isNaN(maxVal) && maxVal > 0) query = query.lte("price", maxVal);
      if (priceRange) {
        const r = PRICE_RANGES.find((x) => x.label === priceRange);
        if (r) {
          query = query.gte("price", r.min);
          if (r.max !== Infinity) query = query.lt("price", r.max);
        }
      }
      if (discountRange) {
        const d = DISCOUNT_RANGES.find((x) => x.label === discountRange);
        if (d) query = query.gte("discount_percent", d.min);
      }
      if (transmission) query = query.eq("transmission", transmission);
      if (fuelType) query = query.eq("fuel_type", fuelType);

      const { data: carsData, error } = await query
        .order("boost_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[cars] Supabase filter error:", error);
      }
      const cars = (carsData as Car[]) ?? [];
      setAllCars(cars);

      const ownerIds = [...new Set(cars.map((c) => c.owner_id).filter(Boolean))] as string[];
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("id, full_name").in("id", ownerIds);
        const map: Record<string, Profile> = {};
        (profilesData ?? []).forEach((p) => { map[p.id] = p; });
        setProfiles(map);
      }
      const hasFilters = !!(keyword.trim() || make || province || type || priceRange || discountRange || transmission || fuelType || minPrice || maxPrice || listingType);
      if (hasFilters) {
        const minVal = minPrice ? parseFloat(String(minPrice).replace(/,/g, "")) : NaN;
        const maxVal = maxPrice ? parseFloat(String(maxPrice).replace(/,/g, "")) : NaN;
        fetch("/api/analytics/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: keyword.trim() || null,
            make: make || null,
            province: province || null,
            minPrice: !isNaN(minVal) && minVal > 0 ? minVal : null,
            maxPrice: !isNaN(maxVal) && maxVal > 0 ? maxVal : null,
            listingType: listingType || null,
          }),
        }).catch(() => {});
      }
      setLoading(false);
    }
    load();
  }, [keyword, make, province, type, priceRange, discountRange, transmission, fuelType, minPrice, maxPrice, listingType]);

  const cars = allCars;
  const newArrivals = [...cars].sort((a, b) => {
    const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bT - aT;
  }).slice(0, 24);

  const makesFromData = Array.from(new Set(allCars.map((c) => c.make).filter(Boolean))).sort();
  const otherCount = allCars.filter((c) => !c.make || !COMMON_MAKES.includes(c.make)).length;
  const makes = [...makesFromData, ...(otherCount > 0 ? [OTHER_MAKE] : [])];
  const types = (Array.from(new Set(allCars.map((c) => c.type).filter(Boolean))) as string[]).sort();

  const makeCounts: Record<string, number> = {};
  allCars.forEach((c) => { if (c.make) makeCounts[c.make] = (makeCounts[c.make] ?? 0) + 1; });
  if (otherCount > 0) makeCounts[OTHER_MAKE] = otherCount;
  const provinceCounts: Record<string, number> = {};
  allCars.forEach((c) => { if (c.province) provinceCounts[c.province] = (provinceCounts[c.province] ?? 0) + 1; });
  const typeCounts: Record<string, number> = {};
  allCars.forEach((c) => { if (c.type) typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1; });
  const transmissionCounts: Record<string, number> = {};
  allCars.forEach((c) => { if (c.transmission) transmissionCounts[c.transmission] = (transmissionCounts[c.transmission] ?? 0) + 1; });
  const fuelTypeCounts: Record<string, number> = {};
  allCars.forEach((c) => { if (c.fuel_type) fuelTypeCounts[c.fuel_type] = (fuelTypeCounts[c.fuel_type] ?? 0) + 1; });

  const ownerCounts: Record<string, number> = {};
  allCars.forEach((c) => { if (c.owner_id) ownerCounts[c.owner_id] = (ownerCounts[c.owner_id] ?? 0) + 1; });

  function getCarPriceLabel(car: Car): { text: string; original?: string; discounted?: string } {
    const lt = car.listing_type ?? "sale";
    if (lt === "rent") {
      const cur = car.rental_currency ?? "USD";
      const tiers = getRentalTiers(car);
      if (tiers.length > 0) {
        const suffix: Record<string, string> = { hour: "hr", day: "day", week: "wk", month: "mo" };
        const text = tiers.map((t) => `${formatPrice(t.price, currency, cur)}/${suffix[t.period]}`).join(" · ");
        return { text };
      }
    }
    const pct = car.discount_percent ?? 0;
    if (pct > 0 && lt !== "rent") {
      const orig = car.price;
      const disc = orig * (1 - pct / 100);
      return {
        text: formatPrice(disc, currency, car.currency ?? null),
        original: formatPrice(orig, currency, car.currency ?? null),
        discounted: formatPrice(disc, currency, car.currency ?? null),
      };
    }
    return { text: formatPrice(car.price, currency, car.currency ?? null) };
  }

  function getListingTypeBadge(car: Car): string | null {
    const lt = car.listing_type ?? "sale";
    if (lt === "both") return t("saleAndRent");
    if (lt === "rent") return t("forRent");
    return null;
  }

  function getDiscountBadge(car: Car): string | null {
    const pct = car.discount_percent ?? 0;
    if (pct > 0 && (car.listing_type === "sale" || car.listing_type === "both" || !car.listing_type)) {
      return `${Math.round(pct)}% off`;
    }
    return null;
  }
  const topSellers = Object.entries(ownerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => ({ id, count, name: profiles[id]?.full_name || t("seller") }));

  const getSortPrice = (c: Car) => {
    const lt = c.listing_type ?? "sale";
    if (lt === "rent") return getBestRentalPrice(c);
    return c.price ?? 0;
  };
  const sortedCars = useMemo(() => {
    return [...cars].sort((a, b) => {
      if (sortBy === "priceLow") return getSortPrice(a) - getSortPrice(b);
      if (sortBy === "priceHigh") return getSortPrice(b) - getSortPrice(a);
      const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bT - aT;
    });
  }, [cars, sortBy]);
  const shuffledCars = useMemo(() => fisherYatesShuffle(sortedCars), [sortedCars, shuffleSeed]);
  const visibleCars = shuffledCars.slice(0, visibleCount);

  const hasActiveFilters = !!(keyword || make || province || type || priceRange || discountRange || transmission || fuelType || minPrice || maxPrice || listingType);
  function clearAllFilters() {
    setKeyword("");
    setMake("");
    setProvince("");
    setType("");
    setPriceRange("");
    setDiscountRange("");
    setTransmission("");
    setFuelType("");
    setMinPrice("");
    setMaxPrice("");
    setListingType("");
    router.replace("/cars");
  }

  function getActiveFilterPills(): { key: string; label: string; onRemove: () => void }[] {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    if (keyword) pills.push({ key: "q", label: keyword, onRemove: () => setKeyword("") });
    if (make) pills.push({ key: "make", label: make === OTHER_MAKE ? t("other") : make, onRemove: () => setMake("") });
    if (province) pills.push({ key: "province", label: province, onRemove: () => setProvince("") });
    if (type) pills.push({ key: "type", label: type, onRemove: () => setType("") });
    if (priceRange) pills.push({ key: "priceRange", label: priceRange, onRemove: () => setPriceRange("") });
    if (discountRange) pills.push({ key: "discountRange", label: discountRange, onRemove: () => setDiscountRange("") });
    if (transmission) pills.push({ key: "transmission", label: t(transmission as "automatic" | "manual"), onRemove: () => setTransmission("") });
    if (fuelType) pills.push({ key: "fuelType", label: t(fuelType as "essence" | "diesel" | "electric" | "hybrid"), onRemove: () => setFuelType("") });
    if (minPrice) pills.push({ key: "minPrice", label: `≥ ${minPrice}`, onRemove: () => setMinPrice("") });
    if (maxPrice) pills.push({ key: "maxPrice", label: `≤ ${maxPrice}`, onRemove: () => setMaxPrice("") });
    if (listingType) pills.push({ key: "listingType", label: t(LISTING_TYPE_TRANSLATION_KEYS[listingType as "sale" | "rent" | "both"] as Parameters<typeof t>[0]), onRemove: () => setListingType("") });
    return pills;
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const exists = prev.includes(id);
      let next: string[];
      if (exists) {
        next = prev.filter((x) => x !== id);
      } else {
        if (prev.length >= 4) return prev;
        next = [...prev, id];
      }
      try {
        localStorage.setItem("compare-cars", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function clearCompare() {
    setCompareIds([]);
    try {
      localStorage.removeItem("compare-cars");
    } catch {
      // ignore
    }
  }

  function saveCurrentSearch() {
    const hasAnyFilter =
      keyword ||
      make ||
      province ||
      type ||
      priceRange ||
      discountRange ||
      transmission ||
      fuelType ||
      minPrice ||
      maxPrice;
    if (!hasAnyFilter) return;

    const data = {
      keyword,
      make,
      province,
      type,
      priceRange,
      discountRange,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      listingType,
    };

    const labelParts: string[] = [];
    if (make) labelParts.push(make);
    if (province) labelParts.push(province);
    if (type) labelParts.push(type);
    if (priceRange) labelParts.push(priceRange);
    if (discountRange) labelParts.push(discountRange);
    const label =
      labelParts.join(" · ") || keyword || t("savedSearches");

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      data,
    };

    setSavedSearches((prev) => {
      const updated = [entry, ...prev].slice(0, 10);
      try {
        localStorage.setItem("saved-searches", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  function applySearch(data: any) {
    setKeyword(data.keyword || "");
    setMake(data.make || "");
    setProvince(data.province || "");
    setType(data.type || "");
    setPriceRange(data.priceRange || "");
    setDiscountRange(data.discountRange || "");
    setTransmission(data.transmission || "");
    setFuelType(data.fuelType || "");
    setMinPrice(data.minPrice || "");
    setMaxPrice(data.maxPrice || "");
    setListingType(data.listingType || "");
  }

  function deleteSearch(id: string) {
    setSavedSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem("saved-searches", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  const sidebarContent = (
    <>
      <FilterBlock title={t("listingType")}>
        <ul className="space-y-1 text-small">
          {(["", "sale", "rent"] as const).map((lt) => (
            <li key={lt || "all"}>
              <button
                type="button"
                onClick={() => setListingType(lt)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${listingType === lt ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {lt ? t(LISTING_TYPE_TRANSLATION_KEYS[lt] as Parameters<typeof t>[0]) : t("all")}
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByTownCity")}>
        <ul className="space-y-1 text-small">
          {DRC_LOCATIONS.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => setProvince(province === p ? "" : p)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${province === p ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {p} ({provinceCounts[p] ?? 0})
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByMake")}>
        <ul className="space-y-1 text-small">
          {makes.map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => setMake(m === make ? "" : m)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${make === m ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {m === OTHER_MAKE ? t("other") : m} ({makeCounts[m] ?? 0})
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByPrice")}>
        <ul className="space-y-1 text-small">
          {PRICE_RANGES.map((r) => (
            <li key={r.label}>
              <button
                type="button"
                onClick={() => setPriceRange(priceRange === r.label ? "" : r.label)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${priceRange === r.label ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByDiscount")}>
        <ul className="space-y-1 text-small">
          {DISCOUNT_RANGES.map((r) => (
            <li key={r.label}>
              <button
                type="button"
                onClick={() => setDiscountRange(discountRange === r.label ? "" : r.label)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${discountRange === r.label ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByType")}>
        <ul className="space-y-1 text-small">
          {types.map((ty) => (
            <li key={ty}>
              <button
                type="button"
                onClick={() => setType(ty === type ? "" : ty)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${type === ty ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {ty} ({typeCounts[ty] ?? 0})
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByTransmission")}>
        <ul className="space-y-1 text-small">
          {(["automatic", "manual"] as const).map((tr) => (
            <li key={tr}>
              <button
                type="button"
                onClick={() => setTransmission(transmission === tr ? "" : tr)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${transmission === tr ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {t(tr)} ({transmissionCounts[tr] ?? 0})
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByFuel")}>
        <ul className="space-y-1 text-small">
          {(["essence", "diesel", "electric", "hybrid"] as const).map((fuel) => (
            <li key={fuel}>
              <button
                type="button"
                onClick={() => setFuelType(fuelType === fuel ? "" : fuel)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${fuelType === fuel ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {t(fuel)} ({fuelTypeCounts[fuel] ?? 0})
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("vehiclesInStock")}>
        <p className="text-base font-bold tracking-tight text-[var(--foreground)]">{allCars.length}</p>
      </FilterBlock>
      <AdPlacement width="sidebar" />
    </>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 h-10 w-64 animate-pulse rounded bg-[var(--border)]" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 sm:gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <CarCardSkeleton key={i} compact />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      {/* Search + mobile filters button */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input-premium max-w-xl"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveCurrentSearch}
              className="btn-secondary"
            >
              {t("saveSearch")}
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn-secondary md:hidden"
              aria-label={t("filters")}
            >
              {t("filters")}
            </button>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {getActiveFilterPills().map((p) => (
              <span
                key={p.key}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-caption text-[var(--foreground)]"
              >
                {p.label}
                <button
                  type="button"
                  onClick={p.onRemove}
                  className="-mr-1 ml-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-[var(--border)]"
                  aria-label={`Remove ${p.label}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="link-accent text-caption font-medium"
            >
              {t("clearAllFilters")}
            </button>
          </div>
        )}
        {savedSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("savedSearches")}:
            </span>
            {savedSearches.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1 rounded-[var(--radius)] bg-[var(--card)] px-2 py-1 text-[10px] text-[var(--foreground)] shadow-[var(--shadow-sm)]"
              >
                <button
                  type="button"
                  onClick={() => applySearch(s.data)}
                  className="hover:underline"
                >
                  {s.label}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSearch(s.id)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  aria-label={t("deleteSearch")}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-52 shrink-0 space-y-4 md:block">
          {sidebarContent}
        </aside>

        {/* Mobile filters drawer */}
        {filtersOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              aria-hidden
              onClick={() => setFiltersOpen(false)}
            />
            <aside className="fixed left-0 top-0 z-50 flex h-full w-[min(100vw,20rem)] flex-col overflow-auto border-r border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-lg)] md:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-heading text-[var(--foreground)]">{t("filters")}</h2>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] text-[var(--foreground)] hover:bg-[var(--border)]"
                  aria-label="Close filters"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                {sidebarContent}
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="btn-primary mt-4 w-full"
              >
                {t("apply")}
              </button>
            </aside>
          </>
        )}

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("topSellersInDRC")}</h2>
          <div className="mb-5 flex flex-wrap gap-2">
            {topSellers.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-[var(--radius)] bg-[var(--border)] px-2.5 py-1 text-[9px] text-[var(--foreground)]"
              >
                {s.name} ({s.count})
                <VerifiedSellerBadge
                  phoneVerified={profiles[s.id]?.phone_verified}
                  idVerified={profiles[s.id]?.id_verified}
                  dealerVerified={profiles[s.id]?.dealer_verified}
                />
              </span>
            ))}
            {topSellers.length === 0 && (
              <p className="text-small text-[var(--muted-foreground)]">{t("noListings")}</p>
            )}
          </div>

          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("newArrivals")}</h2>
          <div
            className={
              density === "compact"
                ? "mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                : "mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-4"
            }
          >
            {newArrivals.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                onClick={() => { try { sessionStorage.setItem("cars-back-url", window.location.href); } catch {} }}
                className={`card-hover-lift card-img-zoom ${density === "compact" ? "card-compact overflow-hidden" : "card-premium overflow-hidden"}`}
              >
                <div className="relative">
                  <div className={`relative ${density === "compact" ? "aspect-[4/3] bg-[var(--border)]" : "aspect-video bg-[var(--border)]"}`}>
                    {car.images?.[0] ? (
                      <OptimizedCarImage
                        src={car.images[0]}
                        alt={car.title}
                        sizes={density === "compact" ? "(max-width: 640px) 50vw, 20vw" : "(max-width: 640px) 50vw, 33vw"}
                      />
                    ) : (
                      <CarImagePlaceholder className="h-full min-h-[80px]" />
                    )}
                    {car.is_sold && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[1]" aria-hidden>
                        <span className="rounded-md border-2 border-white/90 bg-slate-800/95 px-3 py-1.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg">
                          {t("sold")}
                        </span>
                      </div>
                    )}
                    {(getListingTypeBadge(car) || getDiscountBadge(car) || car.is_sold) && (
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1 z-[2]">
                        {car.is_sold && (
                          <span className="rounded bg-slate-700 px-2 py-0.5 text-[9px] font-semibold text-white">
                            {t("sold")}
                          </span>
                        )}
                        {getListingTypeBadge(car) && (
                          <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[9px] font-semibold text-white">
                            {getListingTypeBadge(car)}
                          </span>
                        )}
                        {getDiscountBadge(car) && (
                          <span className="rounded bg-green-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                            {getDiscountBadge(car)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <FavoriteButton
                    carId={car.id}
                    isFav={favoriteIds.has(car.id)}
                    onToggle={(next) => setFavoriteIds((prev) => { const s = new Set(prev); if (next) s.add(car.id); else s.delete(car.id); return s; })}
                    loggedIn={!!user}
                    variant="icon"
                  />
                </div>
                <div className={density === "compact" ? "p-2.5" : "p-4"}>
                  <p className={`${density === "compact" ? "truncate text-[9px]" : "text-[11px]"} font-semibold text-[var(--foreground)] ${car.is_sold ? "opacity-75" : ""}`}>{car.title}</p>
                  <p className={density === "compact" ? "mt-0.5 truncate text-[8px] text-[var(--muted-foreground)]" : "text-[10px] mt-1 text-[var(--muted-foreground)]"}>
                    {car.condition === "new" ? t("new") : t("used")} ·{" "}
                    {(() => {
                      const lbl = getCarPriceLabel(car);
                      if (lbl.original && lbl.discounted) {
                        return (
                          <>
                            <span className="line-through text-[var(--muted-foreground)]">{lbl.original}</span>{" "}
                            <span className="font-semibold text-[var(--accent)]">{lbl.discounted}</span>
                          </>
                        );
                      }
                      return <span className="font-semibold text-[var(--accent)]">{lbl.text}</span>;
                    })()}
                  </p>
                  {car.created_at && (
                    <p className={density === "compact" ? "mt-0.5 text-[8px] text-[var(--muted-foreground)]" : "mt-0.5 text-[10px] text-[var(--muted-foreground)]"}>
                      {formatListedDate(car.created_at, (k) => t(k as "listedToday" | "listedYesterday" | "listedDaysAgo"))}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="mb-6">
            <AdPlacement />
          </div>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("browseAll")}</h2>
            {cars.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-caption text-[var(--muted-foreground)]">
                  {t("showingCount").replace("{n}", String(visibleCars.length)).replace("{total}", String(cars.length))}
                </span>
                <label className="flex items-center gap-2 text-caption text-[var(--muted-foreground)]">
                  <span>{t("showPerPage")}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) as typeof PAGE_SIZE_OPTIONS[number];
                      setPageSize(v);
                      setVisibleCount(v);
                      try { localStorage.setItem("cars-page-size", String(v)); } catch {}
                    }}
                    className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-caption text-[var(--foreground)]"
                    aria-label={t("showPerPage")}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "priceLow" | "priceHigh")}
                  className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-caption text-[var(--foreground)]"
                  aria-label={t("sortBy")}
                >
                  <option value="newest">{t("sortNewest")}</option>
                  <option value="priceLow">{t("sortPriceLow")}</option>
                  <option value="priceHigh">{t("sortPriceHigh")}</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-0.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-0.5">
              <button
                type="button"
                onClick={() => setDensityAndSave("spacious")}
                className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-medium transition ${density === "spacious" ? "bg-[var(--border)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--border)]"}`}
                title="Fewer, larger cards"
                aria-label="Spacious view"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setDensityAndSave("compact")}
                className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-medium transition ${density === "compact" ? "bg-[var(--border)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--border)]"}`}
                title="More, smaller cards"
                aria-label="Compact view"
              >
                +
              </button>
            </div>
          </div>
          {cars.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] py-14 px-6 text-center">
              <p className="text-body mb-6 text-[var(--foreground)]">
                {hasActiveFilters ? t("tryRemovingFilters") : t("noListingsCta")}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="btn-accent"
                >
                  {t("browseAllCars")}
                </button>
              ) : (
                <Link href="/dashboard/cars/new" className="btn-accent inline-flex">
                  {t("listYourCar")}
                </Link>
              )}
            </div>
          ) : (
            <>
              <div
                className={
                  density === "compact"
                    ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                    : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-4"
                }
              >
                {visibleCars.map((car) => (
                  <Link
                    key={car.id}
                    href={`/cars/${car.id}`}
                    onClick={() => { try { sessionStorage.setItem("cars-back-url", window.location.href); } catch {} }}
                    className={`card-hover-lift card-img-zoom ${density === "compact" ? "card-compact overflow-hidden" : "card-premium overflow-hidden"}`}
                  >
                    <div className="relative">
                      <div className={`relative ${density === "compact" ? "aspect-[4/3] bg-[var(--border)]" : "aspect-video bg-[var(--border)]"}`}>
                        {car.images?.[0] ? (
                          <OptimizedCarImage
                            src={car.images[0]}
                            alt={car.title}
                            sizes={density === "compact" ? "(max-width: 640px) 50vw, 25vw" : "(max-width: 640px) 50vw, 33vw"}
                          />
                        ) : (
                          <CarImagePlaceholder className="h-full min-h-[80px]" />
                        )}
                        {car.is_sold && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[1]" aria-hidden>
                            <span className="rounded-md border-2 border-white/90 bg-slate-800/95 px-3 py-1.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg">
                              {t("sold")}
                            </span>
                          </div>
                        )}
                        {(getListingTypeBadge(car) || getDiscountBadge(car) || car.is_sold) && (
                          <div className="absolute left-2 top-2 flex flex-wrap gap-1 z-[2]">
                            {car.is_sold && (
                              <span className="rounded bg-slate-700 px-2 py-0.5 text-[9px] font-semibold text-white">
                                {t("sold")}
                              </span>
                            )}
                            {getListingTypeBadge(car) && (
                              <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[9px] font-semibold text-white">
                                {getListingTypeBadge(car)}
                              </span>
                            )}
                            {getDiscountBadge(car) && (
                              <span className="rounded bg-green-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                {getDiscountBadge(car)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <FavoriteButton
                        carId={car.id}
                        isFav={favoriteIds.has(car.id)}
                        onToggle={(next) => setFavoriteIds((prev) => { const s = new Set(prev); if (next) s.add(car.id); else s.delete(car.id); return s; })}
                        loggedIn={!!user}
                        variant="icon"
                      />
                    </div>
                    <div className={density === "compact" ? "p-2.5" : "p-4"}>
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <p className={`${density === "compact" ? "truncate text-[9px]" : "text-[11px]"} font-semibold text-[var(--foreground)] ${car.is_sold ? "opacity-75" : ""}`}>{car.title}</p>
                        <label className="flex shrink-0 items-center gap-1 text-[8px] text-[var(--muted-foreground)]">
                          <input
                            type="checkbox"
                            checked={compareIds.includes(car.id)}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleCompare(car.id);
                            }}
                            aria-label={t("compare")}
                          />
                          {t("compare")}
                        </label>
                      </div>
                      <p className={density === "compact" ? "mt-0.5 text-[8px] text-[var(--muted-foreground)]" : "text-[10px] mt-0.5 text-[var(--muted-foreground)]"}>
                        {car.condition === "new" ? t("new") : t("used")}
                        {car.year != null && ` · ${car.year}`}
                      </p>
                      {density === "spacious" && (
                        <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                          {car.make} {car.model}
                          {(car.province || car.city) && ` · ${[car.province, car.city].filter(Boolean).join(", ")}`}
                          {car.owner_id && profiles[car.owner_id] && (
                            <span className="ml-1 inline">
                              <VerifiedSellerBadge
                                phoneVerified={profiles[car.owner_id]?.phone_verified}
                                idVerified={profiles[car.owner_id]?.id_verified}
                                dealerVerified={profiles[car.owner_id]?.dealer_verified}
                              />
                            </span>
                          )}
                        </p>
                      )}
                      {car.created_at && (
                        <p className={density === "compact" ? "mt-0.5 text-[8px] text-[var(--muted-foreground)]" : "mt-0.5 text-[10px] text-[var(--muted-foreground)]"}>
                          {formatListedDate(car.created_at, (k) => t(k as "listedToday" | "listedYesterday" | "listedDaysAgo"))}
                        </p>
                      )}
                      <p className={density === "compact" ? "mt-0.5 text-[9px] font-semibold text-[var(--accent)]" : "mt-1 text-[11px] font-semibold text-[var(--accent)]"}>
                        {(() => {
                          const lbl = getCarPriceLabel(car);
                          if (lbl.original && lbl.discounted) {
                            return (
                              <>
                                <span className="line-through text-[var(--muted-foreground)]">{lbl.original}</span>{" "}
                                {lbl.discounted}
                              </>
                            );
                          }
                          return lbl.text;
                        })()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              {cars.length > visibleCount && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => Math.min(c + pageSize, cars.length))}
                    className="btn-secondary"
                  >
                    {t("loadMore")} (+{Math.min(pageSize, cars.length - visibleCount)})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CarsPageContent />
    </Suspense>
  );
}
