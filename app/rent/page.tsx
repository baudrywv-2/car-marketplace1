"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DRC_LOCATIONS, RENTAL_EVENT_TYPES, RENTAL_EVENT_TRANSLATION_KEYS } from "@/lib/constants";
import { formatPrice, getBestRentalPrice, getRentalTiers } from "@/lib/format-utils";
import { readGuestFavorites, GUEST_FAVORITES_KEY } from "@/lib/guest-favorites";
import FavoriteButton from "@/app/components/FavoriteButton";
import CarCardSkeleton from "@/app/components/CarCardSkeleton";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import CarImagePlaceholder from "@/app/components/CarImagePlaceholder";
import LoadingFallback from "@/app/components/LoadingFallback";
import { formatListedDate } from "@/lib/date-utils";

type RentalCar = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number | null;
  type: string | null;
  province: string | null;
  city: string | null;
  images: string[];
  listing_type: string | null;
  rental_price_per_hour: number | null;
  rental_price_per_day: number | null;
  rental_price_per_week: number | null;
  rental_price_per_month: number | null;
  rental_currency: string | null;
  rental_event_type: string[] | null;
  created_at: string | null;
};

function RentPageContent() {
  const searchParams = useSearchParams();
  const { t, currency } = useLocale();
  const [cars, setCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState<string>("");
  const [province, setProvince] = useState("");
  const [keyword, setKeyword] = useState("");
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(24);
  const [sortBy, setSortBy] = useState<"newest" | "priceLow" | "priceHigh">("newest");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
  }, []);

  useEffect(() => {
    const ev = searchParams.get("event");
    if (ev) setEventType(ev);
  }, [searchParams]);

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
          await fetch("/api/favorites/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ carIds: missing }),
            credentials: "include",
          });
          localStorage.removeItem(GUEST_FAVORITES_KEY);
        }
        setFavoriteIds(new Set([...serverIds, ...localIds]));
      } catch {
        setFavoriteIds(new Set(localIds));
      }
    })();
  }, [user]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("cars")
        .select("id, title, make, model, year, type, province, city, images, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_event_type, created_at")
        .eq("is_approved", true)
        .eq("is_draft", false)
        .or("listing_type.eq.rent,listing_type.eq.both");

      if (eventType) {
        query = query.contains("rental_event_type", [eventType]);
      }
      if (province) query = query.eq("province", province);
      if (keyword.trim()) {
        const k = keyword.trim().replace(/%/g, "\\%").replace(/_/g, "\\_");
        const pat = `%${k}%`;
        query = query.or(`title.ilike.${pat},make.ilike.${pat},model.ilike.${pat}`);
      }

      const { data } = await query.order("created_at", { ascending: false });
      setCars((data as RentalCar[]) ?? []);
      const hasFilters = !!(eventType || province || keyword.trim());
      if (hasFilters) {
        fetch("/api/analytics/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: keyword.trim() || null,
            province: province || null,
            listingType: "rent",
            eventType: eventType || null,
          }),
        }).catch(() => {});
      }
      setLoading(false);
    }
    load();
  }, [eventType, province, keyword]);

  function selectEvent(ev: string) {
    setEventType(ev);
    const url = new URL(window.location.href);
    if (ev) url.searchParams.set("event", ev);
    else url.searchParams.delete("event");
    window.history.replaceState({}, "", url.toString());
  }

  const sortedCars = [...cars].sort((a, b) => {
    if (sortBy === "priceLow") return getBestRentalPrice(a) - getBestRentalPrice(b);
    if (sortBy === "priceHigh") return getBestRentalPrice(b) - getBestRentalPrice(a);
    const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bT - aT;
  });
  const visibleCars = sortedCars.slice(0, visibleCount);

  function formatRentalPrice(car: RentalCar): string {
    const cur = car.rental_currency ?? "USD";
    const tiers = getRentalTiers(car);
    if (tiers.length === 0) return "";
    const suffix: Record<string, string> = { hour: "hr", day: "day", week: "wk", month: "mo" };
    return tiers.map((tier) => `${formatPrice(tier.price, currency as "USD" | "CDF", cur)}/${suffix[tier.period]}`).join(" · ");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 h-10 w-64 animate-pulse rounded bg-[var(--border)]" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <CarCardSkeleton key={i} compact />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-6">
        <h1 className="text-display text-[var(--foreground)] font-mono">{t("rentTitle")}</h1>
        <p className="mt-1 text-caption text-[var(--muted-foreground)]">{t("rentSubtitle")}</p>
      </div>

      {/* Event category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectEvent("")}
          className={`rounded-[var(--radius)] border px-3 py-2 text-caption font-medium transition ${
            !eventType ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          {t("all")}
        </button>
        {RENTAL_EVENT_TYPES.map((ev) => (
          <button
            key={ev.value}
            type="button"
            onClick={() => selectEvent(ev.value)}
            className={`rounded-[var(--radius)] border px-3 py-2 text-caption font-medium transition ${
              eventType === ev.value ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t(RENTAL_EVENT_TRANSLATION_KEYS[ev.value] as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="input-premium max-w-xl"
        />
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="input-premium max-w-[200px]"
          aria-label={t("shopByTownCity")}
        >
          <option value="">{t("all")} {t("shopByTownCity")}</option>
          {DRC_LOCATIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "priceLow" | "priceHigh")}
          className="input-premium max-w-[180px]"
          aria-label={t("sortBy")}
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="priceLow">{t("sortPriceLow")}</option>
          <option value="priceHigh">{t("sortPriceHigh")}</option>
        </select>
      </div>

      {cars.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] py-14 px-6 text-center">
          <p className="text-body mb-6 text-[var(--foreground)]">{t("noRentalListings")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/cars" className="btn-accent">
              {t("browseCars")}
            </Link>
            <Link href="/dashboard/cars/new" className="btn-secondary">
              {t("listYourCar")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            {t("showingCount").replace("{n}", String(visibleCars.length)).replace("{total}", String(cars.length))}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visibleCars.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                onClick={() => { try { sessionStorage.setItem("cars-back-url", window.location.href); } catch {} }}
                className="card-compact card-hover-lift card-img-zoom overflow-hidden"
              >
                <div className="relative">
                  <div className="relative aspect-[4/3] bg-[var(--border)]">
                    {car.images?.[0] ? (
                      <OptimizedCarImage src={car.images[0]} alt={car.title} sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <CarImagePlaceholder className="h-full min-h-[80px]" />
                    )}
                  </div>
                  <span className="absolute left-2 top-2 rounded bg-[var(--accent)] px-2 py-0.5 text-[9px] font-semibold text-white">
                    {t("forRent")}
                  </span>
                  <FavoriteButton
                    carId={car.id}
                    isFav={favoriteIds.has(car.id)}
                    onToggle={(next) => setFavoriteIds((prev) => { const s = new Set(prev); if (next) s.add(car.id); else s.delete(car.id); return s; })}
                    loggedIn={!!user}
                    variant="icon"
                  />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[9px] font-semibold text-[var(--foreground)]">{car.title}</p>
                  <p className="mt-0.5 truncate text-[8px] text-[var(--muted-foreground)]">
                    {car.year != null && `${car.year} · `}
                    {car.province || car.city || ""}
                  </p>
                  {car.rental_event_type && car.rental_event_type.length > 0 && (
                    <p className="mt-0.5 flex flex-wrap gap-1 text-[8px] text-[var(--muted-foreground)]">
                      {car.rental_event_type.slice(0, 2).map((ev) => (
                        <span key={ev} className="rounded bg-[var(--border)] px-1">{t(RENTAL_EVENT_TRANSLATION_KEYS[ev as keyof typeof RENTAL_EVENT_TRANSLATION_KEYS] as Parameters<typeof t>[0])}</span>
                      ))}
                    </p>
                  )}
                  <p className="mt-0.5 text-[9px] font-semibold text-[var(--accent)]">
                    {formatRentalPrice(car) || t("priceFrom")}
                  </p>
                  {car.created_at && (
                    <p className="mt-0.5 text-[8px] text-[var(--muted-foreground)]">
                      {formatListedDate(car.created_at, (k) => t(k as "listedToday" | "listedYesterday" | "listedDaysAgo"))}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {cars.length > visibleCount && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + 24, cars.length))}
                className="btn-secondary"
              >
                {t("loadMore")} (+{Math.min(24, cars.length - visibleCount)})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RentPageContent />
    </Suspense>
  );
}
