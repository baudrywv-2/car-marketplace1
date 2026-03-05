"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { COMMON_MAKES, OTHER_MAKE } from "@/lib/constants";
import { formatPrice } from "@/lib/format-utils";
import FadeInSection from "@/app/components/FadeInSection";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import CarImagePlaceholder from "@/app/components/CarImagePlaceholder";

type Car = {
  id: string;
  title: string;
  price: number;
  make?: string;
  model?: string;
  year?: number | null;
  condition?: string | null;
  currency?: string | null;
  images?: string[] | null;
  is_sold?: boolean | null;
};

type RecentCar = Car & { image?: string | null };

const POPULAR_MAKES = [...COMMON_MAKES, OTHER_MAKE];

function buildSearchUrl(params: { q?: string; make?: string; minPrice?: string; maxPrice?: string }) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.make) searchParams.set("make", params.make);
  if (params.minPrice) searchParams.set("minPrice", params.minPrice);
  if (params.maxPrice) searchParams.set("maxPrice", params.maxPrice);
  const qs = searchParams.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

function CarCard({
  car,
  currency,
  t,
  compact,
}: {
  car: Car | RecentCar;
  currency: "USD" | "CDF";
  t: (k: string) => string;
  featured?: boolean;
  compact?: boolean;
}) {
  const img = "image" in car ? car.image : car.images?.[0];
  return (
    <Link
      href={`/cars/${car.id}`}
      className={`block overflow-hidden group ${compact ? "card-compact rounded-lg border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--accent)]/50 hover:shadow-md" : "card-premium card-hover-lift card-img-zoom"}`}
    >
      <div className={`relative bg-[var(--border)] ${compact ? "aspect-[4/3]" : "aspect-video"}`}>
        {img ? (
          <OptimizedCarImage
            src={img}
            alt={car.title}
            sizes={compact ? "(max-width: 640px) 50vw, 16vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          />
        ) : (
          <CarImagePlaceholder className={`h-full ${compact ? "min-h-[60px]" : "min-h-[80px]"}`} />
        )}
        {"is_sold" in car && car.is_sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[1]" aria-hidden>
            <span className="rounded border border-white/80 bg-slate-800/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {t("sold")}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className={compact ? "p-2" : "p-3"}>
        <p className={`font-medium text-[var(--foreground)] line-clamp-2 font-mono ${compact ? "text-[11px] leading-tight" : "text-sm"}`}>
          {car.title}
        </p>
        <p className={`mt-0.5 text-[var(--muted-foreground)] font-mono ${compact ? "text-[10px]" : "text-xs"}`}>
          {(car.condition === "new" ? t("new") : t("used"))}
          {car.year != null && ` · ${car.year}`}
        </p>
        <p className={`font-semibold text-[var(--accent)] font-mono ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}>
          {formatPrice(car.price, currency, car.currency ?? null)}
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const router = useRouter();
  const { t, currency } = useLocale();
  const [recent, setRecent] = useState<RecentCar[]>([]);
  const [popularMakes, setPopularMakes] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchMake, setSearchMake] = useState("");
  const [searchMinPrice, setSearchMinPrice] = useState("");
  const [searchMaxPrice, setSearchMaxPrice] = useState("");

  useEffect(() => {
    (async () => {
      const { data: metaData } = await supabase
        .from("cars")
        .select("make")
        .eq("is_approved", true)
        .eq("is_draft", false)
        .limit(500);
      const meta = (metaData ?? []) as { make: string | null }[];
      const makeCounts: Record<string, number> = {};
      meta.forEach((r) => {
        if (r.make) makeCounts[r.make] = (makeCounts[r.make] ?? 0) + 1;
      });
      const otherCount = meta.filter((r) => !r.make || !COMMON_MAKES.includes(r.make)).length;
      const topMakes = Object.entries(makeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([m]) => m);
      setPopularMakes([...topMakes, ...(otherCount > 0 ? [OTHER_MAKE] : [])]);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("recently-viewed-cars");
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return;
        const cleaned = parsed.filter(
          (item: unknown) =>
            item && typeof (item as RecentCar).id === "string" && typeof (item as RecentCar).title === "string" && typeof (item as RecentCar).price === "number"
        ) as RecentCar[];
        const ids = cleaned.slice(0, 12).map((c) => c.id);
        if (ids.length === 0) return;
        const { data } = await supabase
          .from("cars")
          .select("id, title, price, make, model, year, condition, currency, images, is_sold")
          .eq("is_approved", true)
          .eq("is_draft", false)
          .in("id", ids);
        const stillValid = (data ?? []) as RecentCar[];
        if (stillValid.length === 0) {
          setRecent([]);
          localStorage.removeItem("recently-viewed-cars");
          return;
        }
        const orderMap = new Map(ids.map((id, i) => [id, i]));
        const sorted = stillValid.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)).slice(0, 6);
        setRecent(sorted);
        localStorage.setItem("recently-viewed-cars", JSON.stringify(sorted));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const makesToShow = popularMakes.length > 0 ? popularMakes : POPULAR_MAKES;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const url = buildSearchUrl({ q: searchQ || undefined, make: searchMake || undefined, minPrice: searchMinPrice || undefined, maxPrice: searchMaxPrice || undefined });
    fetch("/api/analytics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: searchQ?.trim() || null,
        make: searchMake || null,
        minPrice: searchMinPrice ? parseFloat(String(searchMinPrice).replace(/,/g, "")) : null,
        maxPrice: searchMaxPrice ? parseFloat(String(searchMaxPrice).replace(/,/g, "")) : null,
      }),
    }).catch(() => {});
    router.push(url);
  }

  return (
    <div className="bg-[var(--background)]">
      {/* Hero – compact, cursor/IDE style */}
      <section className="relative min-h-[50vh] overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0" aria-hidden>
          <Image
            src="https://unsplash.com/photos/ZZlWF_nRyz0/download?force=true&w=1600&q=85"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" aria-hidden />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-sm font-logo text-[var(--accent)] mb-1">
                <span className="opacity-60">&gt;</span> {t("siteName")}
              </p>
              <h1 className="text-display text-white font-mono">
                {t("homeTitle")}
              </h1>
              <p className="mt-2 text-sm text-white/70 font-mono">{t("trustedIn")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/cars" className="btn-accent shrink-0 px-4 py-2 text-sm">
                  {t("browseCars")}
                </Link>
                <Link href="/rent" className="btn-rent shrink-0 px-4 py-2 text-sm">
                  {t("rentCars")}
                </Link>
                <Link href="/dashboard/cars/new" className="btn-secondary shrink-0 px-4 py-2 text-sm border-white/30 text-white hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  {t("listYourCar")}
                </Link>
              </div>
            </div>

            {/* Search – compact inline */}
            <form onSubmit={handleSearch} className="flex-1 sm:max-w-xl">
              <div className="rounded border border-white/10 bg-black/30 backdrop-blur-sm p-4 font-mono">
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="input-premium min-h-[40px] flex-1 min-w-[200px] text-sm border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  />
                  <select
                    value={searchMake}
                    onChange={(e) => setSearchMake(e.target.value)}
                    className="input-premium min-h-[40px] min-w-[110px] text-sm border-white/10 bg-white/5 text-white"
                  >
                    <option value="">{t("shopByMake")}</option>
                    {makesToShow.map((m) => (
                      <option key={m} value={m} className="text-[var(--foreground)]">{m}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t("minPrice")}
                      value={searchMinPrice}
                      onChange={(e) => setSearchMinPrice(e.target.value)}
                      className="input-premium min-w-[100px] min-h-[40px] px-3 text-sm border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    />
                    <input
                      type="number"
                      placeholder={t("maxPrice")}
                      value={searchMaxPrice}
                      onChange={(e) => setSearchMaxPrice(e.target.value)}
                      className="input-premium min-w-[100px] min-h-[40px] px-3 text-sm border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    />
                  </div>
                  <button type="submit" className="btn-accent min-h-[40px] shrink-0 px-5 text-sm">
                    {t("browseCars")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Recently viewed */}
      {recent.length > 0 && (
        <section className="py-4 sm:py-6 border-b border-[var(--border)]">
          <FadeInSection delay={0}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-subheading mb-2 text-[var(--foreground)] font-mono">
                <span className="text-[var(--accent)] opacity-80">&gt;</span> {t("recentlyViewed")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {recent.map((car) => (
                  <CarCard key={car.id} car={car} currency={currency} t={t as (k: string) => string} compact />
                ))}
              </div>
            </div>
          </FadeInSection>
        </section>
      )}
    </div>
  );
}
