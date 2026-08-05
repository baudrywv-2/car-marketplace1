"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { COMMON_MAKES, OTHER_MAKE, DRC_LOCATIONS, LISTING_TYPE_TRANSLATION_KEYS, CAR_TYPES } from "@/lib/constants";
import { getBestRentalPrice } from "@/lib/format-utils";
import { readGuestFavorites, GUEST_FAVORITES_KEY } from "@/lib/guest-favorites";
import {
  PRICE_RANGES,
  DISCOUNT_RANGES,
  applyCarFilters,
  filtersFromSearchParams,
  hasAnyCarFilter,
  type CarSearchFilters,
} from "@/lib/car-search-query";
import {
  loadSavedSearches,
  persistSavedSearch,
  removeSavedSearch,
  type SavedSearchEntry,
} from "@/lib/saved-searches";
import CarCardSkeleton from "@/app/components/CarCardSkeleton";
import VerifiedSellerBadge from "@/app/components/VerifiedSellerBadge";
import LoadingFallback from "@/app/components/LoadingFallback";
import CompareBar from "@/app/components/CompareBar";
import FadeInSection from "@/app/components/FadeInSection";
import EmptyState from "@/app/components/EmptyState";
import BuyerCarCard from "@/app/components/BuyerCarCard";

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
  mileage?: number | null;
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
  boost_score?: number | null;
};

type Profile = { id: string; full_name: string | null; phone_verified?: boolean; id_verified?: boolean; dealer_verified?: boolean };

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
/** Cap catalog payload so browse stays fast as inventory grows */
const CARS_FETCH_LIMIT = 60;

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

function CarsPageContent({
  initialCars = null,
  initialProfiles = null,
}: {
  initialCars?: Car[] | null;
  initialProfiles?: Record<string, Profile> | null;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const initial = filtersFromSearchParams(searchParams);
  const [allCars, setAllCars] = useState<Car[]>(initialCars ?? []);
  const [profiles, setProfiles] = useState<Record<string, Profile>>(initialProfiles ?? {});
  const [loading, setLoading] = useState(!initialCars);
  const skipNextFetch = useRef(!!initialCars);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState(() => initial.q ?? "");
  const [debouncedKeyword, setDebouncedKeyword] = useState(() => initial.q ?? "");
  const [make, setMake] = useState(() => initial.make ?? "");
  const [modelFilter, setModelFilter] = useState(() => initial.model ?? "");
  const [province, setProvince] = useState(() => initial.province ?? "");
  const [type, setType] = useState(() => initial.type ?? "");
  const [priceRange, setPriceRange] = useState(() => initial.priceRange ?? "");
  const [discountRange, setDiscountRange] = useState(() => initial.discountRange ?? "");
  const [transmission, setTransmission] = useState(() => initial.transmission ?? "");
  const [fuelType, setFuelType] = useState(() => initial.fuelType ?? "");
  const [minPrice, setMinPrice] = useState(() => initial.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(() => initial.maxPrice ?? "");
  const [minYear, setMinYear] = useState(() => initial.minYear ?? "");
  const [maxYear, setMaxYear] = useState(() => initial.maxYear ?? "");
  const [condition, setCondition] = useState(() => initial.condition ?? "");
  const [density, setDensity] = useState<"compact" | "spacious">("compact");
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(24);
  const [visibleCount, setVisibleCount] = useState(24);
  const [savedSearches, setSavedSearches] = useState<SavedSearchEntry[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "priceLow" | "priceHigh">(
    () => initial.sort ?? "newest"
  );
  const [listingType, setListingType] = useState<"" | "sale" | "rent">(
    () => initial.listingType ?? ""
  );

  function currentFilters(): CarSearchFilters {
    return {
      q: debouncedKeyword,
      make,
      model: modelFilter,
      province,
      type,
      priceRange,
      discountRange,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      listingType,
      minYear,
      maxYear,
      condition,
      sort: sortBy,
    };
  }

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
      const entries = await loadSavedSearches(supabase, u?.id ?? null);
      setSavedSearches(entries);
    })();
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
    if (!user?.id) return;
    loadSavedSearches(supabase, user.id).then(setSavedSearches);
  }, [user?.id]);

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
  }, [
    debouncedKeyword,
    make,
    province,
    type,
    priceRange,
    discountRange,
    transmission,
    fuelType,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    condition,
    pageSize,
    listingType,
    modelFilter,
  ]);

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
    const f = filtersFromSearchParams(searchParams);
    setKeyword(f.q ?? "");
    setDebouncedKeyword(f.q ?? "");
    setMake(f.make ?? "");
    setModelFilter(f.model ?? "");
    setProvince(f.province ?? "");
    setType(f.type ?? "");
    setPriceRange(f.priceRange ?? "");
    setDiscountRange(f.discountRange ?? "");
    setTransmission(f.transmission ?? "");
    setFuelType(f.fuelType ?? "");
    setMinPrice(f.minPrice ?? "");
    setMaxPrice(f.maxPrice ?? "");
    setListingType(f.listingType ?? "");
    setMinYear(f.minYear ?? "");
    setMaxYear(f.maxYear ?? "");
    setCondition(f.condition ?? "");
    setSortBy(f.sort ?? "newest");
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      q: debouncedKeyword.trim(),
      make,
      model: modelFilter,
      province,
      type,
      priceRange,
      discountRange,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      listingType,
      minYear,
      maxYear,
      condition,
      sort: sortBy !== "newest" ? sortBy : "",
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const next = params.toString();
    if (next !== searchParams.toString()) {
      router.replace(next ? `/cars?${next}` : "/cars", { scroll: false });
    }
  }, [
    debouncedKeyword,
    make,
    modelFilter,
    province,
    type,
    priceRange,
    discountRange,
    transmission,
    fuelType,
    minPrice,
    maxPrice,
    listingType,
    minYear,
    maxYear,
    condition,
    sortBy,
    router,
    searchParams,
  ]);

  function setDensityAndSave(value: "compact" | "spacious") {
    setDensity(value);
    localStorage.setItem("cars-view-density", value);
  }

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    async function load() {
      setLoading(true);
      const filters = currentFilters();
      let query = supabase
        .from("cars")
        .select(
          "id, title, price, make, model, year, type, province, city, images, currency, condition, discount_percent, transmission, fuel_type, mileage, owner_id, created_at, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_event_type, is_sold, boost_score"
        )
        .eq("is_approved", true)
        .eq("is_draft", false);

      query = applyCarFilters(query, filters);

      const { data: carsData, error } = await query
        .order("boost_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(CARS_FETCH_LIMIT);
      if (error) {
        console.error("[cars] Supabase filter error:", error);
      }
      const cars = (carsData as Car[]) ?? [];
      setAllCars(cars);

      const ownerIds = [...new Set(cars.map((c) => c.owner_id).filter(Boolean))] as string[];
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, phone_verified, id_verified, dealer_verified")
          .in("id", ownerIds);
        const map: Record<string, Profile> = {};
        (profilesData ?? []).forEach((p) => {
          map[p.id] = p;
        });
        setProfiles(map);
      } else {
        setProfiles({});
      }
      if (hasAnyCarFilter(filters)) {
        const minVal = minPrice ? parseFloat(String(minPrice).replace(/,/g, "")) : NaN;
        const maxVal = maxPrice ? parseFloat(String(maxPrice).replace(/,/g, "")) : NaN;
        fetch("/api/analytics/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: debouncedKeyword.trim() || null,
            make: make || null,
            province: province || null,
            minPrice: !isNaN(minVal) && minVal > 0 ? minVal : null,
            maxPrice: !isNaN(maxVal) && maxVal > 0 ? maxVal : null,
            listingType: listingType || null,
            filters: {
              type: type || null,
              model: modelFilter || null,
              transmission: transmission || null,
              fuelType: fuelType || null,
              priceRange: priceRange || null,
              discountRange: discountRange || null,
              minYear: minYear || null,
              maxYear: maxYear || null,
              condition: condition || null,
              sort: sortBy,
            },
          }),
        }).catch(() => {});
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentFilters derived from listed deps
  }, [
    debouncedKeyword,
    make,
    modelFilter,
    province,
    type,
    priceRange,
    discountRange,
    transmission,
    fuelType,
    minPrice,
    maxPrice,
    listingType,
    minYear,
    maxYear,
    condition,
  ]);

  const cars = allCars;
  const modelOptions = useMemo(() => {
    if (!make || make === OTHER_MAKE) return [] as { name: string; count: number }[];
    const counts: Record<string, number> = {};
    allCars.forEach((c) => {
      const m = (c.model || "").trim();
      if (m) counts[m] = (counts[m] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [allCars, make]);
  const newArrivals = [...cars].sort((a, b) => {
    const aBoost = a.boost_score ?? 0;
    const bBoost = b.boost_score ?? 0;
    if (bBoost !== aBoost) return bBoost - aBoost;
    const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bT - aT;
  }).slice(0, 8);

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
      const aBoost = a.boost_score ?? 0;
      const bBoost = b.boost_score ?? 0;
      if (bBoost !== aBoost) return bBoost - aBoost;
      const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bT - aT;
    });
  }, [cars, sortBy]);
  const visibleCars = sortedCars.slice(0, visibleCount);

  const hasActiveFilters = hasAnyCarFilter(currentFilters());
  function clearAllFilters() {
    setKeyword("");
    setMake("");
    setModelFilter("");
    setProvince("");
    setType("");
    setPriceRange("");
    setDiscountRange("");
    setTransmission("");
    setFuelType("");
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setCondition("");
    setListingType("");
    setSortBy("newest");
    router.replace("/cars");
  }

  function getActiveFilterPills(): { key: string; label: string; onRemove: () => void }[] {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    if (keyword) pills.push({ key: "q", label: keyword, onRemove: () => setKeyword("") });
    if (make) pills.push({ key: "make", label: make === OTHER_MAKE ? t("other") : make, onRemove: () => { setMake(""); setModelFilter(""); } });
    if (modelFilter) pills.push({ key: "model", label: modelFilter, onRemove: () => setModelFilter("") });
    if (province) pills.push({ key: "province", label: province, onRemove: () => setProvince("") });
    if (type) pills.push({ key: "type", label: type, onRemove: () => setType("") });
    if (priceRange) pills.push({ key: "priceRange", label: t(priceRange as "priceUnder1000" | "price1000to5000" | "price5000to10000" | "priceOver10000"), onRemove: () => setPriceRange("") });
    if (discountRange) pills.push({ key: "discountRange", label: t(discountRange as "discount10" | "discount20" | "discount30"), onRemove: () => setDiscountRange("") });
    if (transmission) pills.push({ key: "transmission", label: t(transmission as "automatic" | "manual"), onRemove: () => setTransmission("") });
    if (fuelType) {
      pills.push({
        key: "fuelType",
        label:
          fuelType === "electric-hybrid"
            ? t("electricHybrids")
            : t(fuelType as "essence" | "diesel" | "electric" | "hybrid"),
        onRemove: () => setFuelType(""),
      });
    }
    if (minPrice) pills.push({ key: "minPrice", label: `≥ ${minPrice}`, onRemove: () => setMinPrice("") });
    if (maxPrice) pills.push({ key: "maxPrice", label: `≤ ${maxPrice}`, onRemove: () => setMaxPrice("") });
    if (minYear) pills.push({ key: "minYear", label: `${t("year")} ≥ ${minYear}`, onRemove: () => setMinYear("") });
    if (maxYear) pills.push({ key: "maxYear", label: `${t("year")} ≤ ${maxYear}`, onRemove: () => setMaxYear("") });
    if (condition) pills.push({ key: "condition", label: t(condition as "new" | "used"), onRemove: () => setCondition("") });
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
    const filters = currentFilters();
    if (!hasAnyCarFilter(filters)) return;

    const data = {
      ...filters,
      keyword: keyword,
    };

    const labelParts: string[] = [];
    if (make) labelParts.push(make === OTHER_MAKE ? t("other") : make);
    if (province) labelParts.push(province);
    if (type) labelParts.push(type);
    if (priceRange) labelParts.push(t(priceRange as "priceUnder1000" | "price1000to5000" | "price5000to10000" | "priceOver10000"));
    if (discountRange) labelParts.push(t(discountRange as "discount10" | "discount20" | "discount30"));
    if (condition) labelParts.push(t(condition as "new" | "used"));
    const label = labelParts.join(" · ") || keyword || t("savedSearches");

    const entry: SavedSearchEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      data,
    };

    persistSavedSearch(supabase, user?.id ?? null, entry, savedSearches).then(setSavedSearches);
  }

  function applySearch(data: SavedSearchEntry["data"]) {
    setKeyword(data.keyword || data.q || "");
    setMake(data.make || "");
    setModelFilter(data.model || "");
    setProvince(data.province || "");
    setType(data.type || "");
    setPriceRange(data.priceRange || "");
    setDiscountRange(data.discountRange || "");
    setTransmission(data.transmission || "");
    setFuelType(data.fuelType || "");
    setMinPrice(data.minPrice || "");
    setMaxPrice(data.maxPrice || "");
    setListingType(data.listingType || "");
    setMinYear(data.minYear || "");
    setMaxYear(data.maxYear || "");
    setCondition(data.condition || "");
    setSortBy(data.sort || "newest");
  }

  function deleteSearch(id: string) {
    removeSavedSearch(supabase, user?.id ?? null, id, savedSearches).then(setSavedSearches);
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
                onClick={() => {
                  setMake(m === make ? "" : m);
                  setModelFilter("");
                }}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${make === m ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {m === OTHER_MAKE ? t("other") : m} ({makeCounts[m] ?? 0})
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByPrice")}>
        <ul className="mb-2 space-y-1 text-small">
          {PRICE_RANGES.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => {
                  const next = priceRange === r.key ? "" : r.key;
                  setPriceRange(next);
                  if (next) {
                    setMinPrice("");
                    setMaxPrice("");
                  }
                }}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${priceRange === r.key ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {t(r.key)}
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("filterMinPrice")}
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              if (e.target.value) setPriceRange("");
            }}
            className="input-premium px-2 py-1.5 text-[11px]"
            aria-label={t("filterMinPrice")}
          />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t("filterMaxPrice")}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              if (e.target.value) setPriceRange("");
            }}
            className="input-premium px-2 py-1.5 text-[11px]"
            aria-label={t("filterMaxPrice")}
          />
        </div>
      </FilterBlock>
      <FilterBlock title={t("shopByDiscount")}>
        <ul className="space-y-1 text-small">
          {DISCOUNT_RANGES.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                onClick={() => setDiscountRange(discountRange === r.key ? "" : r.key)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${discountRange === r.key ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {t(r.key)}
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("shopByType")}>
        <ul className="space-y-1 text-small">
          {(types.length > 0 ? types : [...CAR_TYPES]).map((ty) => (
            <li key={ty}>
              <button
                type="button"
                onClick={() => setType(ty === type ? "" : ty)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${type === ty ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {ty} {typeCounts[ty] != null ? `(${typeCounts[ty]})` : ""}
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("condition")}>
        <ul className="space-y-1 text-small">
          {(["new", "used"] as const).map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => setCondition(condition === c ? "" : c)}
                className={`block w-full rounded-[var(--radius)] py-2 text-left ${condition === c ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
              >
                {t(c)}
              </button>
            </li>
          ))}
        </ul>
      </FilterBlock>
      <FilterBlock title={t("year")}>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="number"
            min={1980}
            max={2100}
            inputMode="numeric"
            placeholder={t("yearFrom")}
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
            className="input-premium px-2 py-1.5 text-[11px]"
            aria-label={t("yearFrom")}
          />
          <input
            type="number"
            min={1980}
            max={2100}
            inputMode="numeric"
            placeholder={t("yearTo")}
            value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)}
            className="input-premium px-2 py-1.5 text-[11px]"
            aria-label={t("yearTo")}
          />
        </div>
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
    <div className={`mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 ${compareIds.length > 0 ? "pb-32 sm:pb-24" : ""}`}>
      {/* Search + mobile filters button */}
      <div className="mb-3 space-y-2 sm:mb-4 sm:space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
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
              className="btn-secondary min-h-10 flex-1 px-3 text-[11px] sm:min-h-[44px] sm:flex-none sm:text-[0.8125rem]"
            >
              {t("saveSearch")}
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn-secondary min-h-10 px-3 text-[11px] md:hidden sm:min-h-[44px] sm:text-[0.8125rem]"
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
                  aria-label={t("closeFilters")}
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

          {make && modelOptions.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setModelFilter("")} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${!modelFilter ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40"}`}>
                {t("all")}
              </button>
              {modelOptions.map(({ name, count }) => (
                <button key={name} type="button" onClick={() => setModelFilter(modelFilter === name ? "" : name)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${modelFilter === name ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40"}`}>
                  {name} <span className="font-mono opacity-70">{count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("newArrivals")}</h2>
            <div className="flex items-center gap-0.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-0.5">
              <button
                type="button"
                onClick={() => setDensityAndSave("spacious")}
                className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-[10px] font-medium transition ${density === "spacious" ? "bg-[var(--border)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--border)]"}`}
                title={t("spaciousView")}
                aria-label={t("spaciousView")}
                aria-pressed={density === "spacious"}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setDensityAndSave("compact")}
                className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-[10px] font-medium transition ${density === "compact" ? "bg-[var(--border)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--border)]"}`}
                title={t("compactView")}
                aria-label={t("compactView")}
                aria-pressed={density === "compact"}
              >
                ≡
              </button>
            </div>
          </div>
          <FadeInSection
            stagger
            className={
              density === "compact"
                ? "mb-6 grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                : "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-4"
            }
          >
            {newArrivals.map((car) => (
              <BuyerCarCard
                key={car.id}
                car={car}
                compact={density === "compact"}
                showFavorite
                isFav={favoriteIds.has(car.id)}
                loggedIn={!!user}
                onFavToggle={(next) => setFavoriteIds((prev) => { const s = new Set(prev); if (next) s.add(car.id); else s.delete(car.id); return s; })}
                compareChecked={compareIds.includes(car.id)}
                onCompareToggle={() => toggleCompare(car.id)}
                onNavigate={() => { try { sessionStorage.setItem("cars-back-url", window.location.href); } catch {} }}
              />
            ))}
          </FadeInSection>

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
                title={t("spaciousView")}
                aria-label={t("spaciousView")}
                aria-pressed={density === "spacious"}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setDensityAndSave("compact")}
                className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-medium transition ${density === "compact" ? "bg-[var(--border)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--border)]"}`}
                title={t("compactView")}
                aria-label={t("compactView")}
                aria-pressed={density === "compact"}
              >
                ≡
              </button>
            </div>
          </div>
          {cars.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? t("tryRemovingFilters") : t("noListingsCta")}
              actionHref={hasActiveFilters ? undefined : "/dashboard/cars/new"}
              actionLabel={hasActiveFilters ? t("browseAllCars") : t("listYourCar")}
              onAction={hasActiveFilters ? clearAllFilters : undefined}
            />
          ) : (
            <>
              <div
                className={
                  density === "compact"
                    ? "grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                    : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-4"
                }
              >
                {visibleCars.map((car) => (
                  <BuyerCarCard
                    key={car.id}
                    car={car}
                    compact={density === "compact"}
                    showFavorite
                    isFav={favoriteIds.has(car.id)}
                    loggedIn={!!user}
                    onFavToggle={(next) => setFavoriteIds((prev) => { const s = new Set(prev); if (next) s.add(car.id); else s.delete(car.id); return s; })}
                    compareChecked={compareIds.includes(car.id)}
                    onCompareToggle={() => toggleCompare(car.id)}
                    onNavigate={() => { try { sessionStorage.setItem("cars-back-url", window.location.href); } catch {} }}
                  />
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
      {compareIds.length > 0 && (
        <CompareBar ids={compareIds} onClear={clearCompare} />
      )}
    </div>
  );
}

export type CarsPageInitialData = {
  cars: Car[];
  profiles: Record<string, Profile>;
};

export default function CarsPageClient({
  initialCars = null,
  initialProfiles = null,
}: {
  initialCars?: Car[] | null;
  initialProfiles?: Record<string, Profile> | null;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CarsPageContent initialCars={initialCars} initialProfiles={initialProfiles} />
    </Suspense>
  );
}
