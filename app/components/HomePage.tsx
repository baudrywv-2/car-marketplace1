"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { CAR_MAKES, COMMON_MAKES, OTHER_MAKE, ELECTRIC_HYBRID_STRIP, MAKE_STRIP_PRIORITY, SUPPORT_EMAIL, SUPPORT_MAILTO, sortMakesForDrc } from "@/lib/constants";
import FadeInSection from "@/app/components/FadeInSection";
import BuyerCarCard, { type BuyerCarCardData } from "@/app/components/BuyerCarCard";
import HomeOffersCarousel from "@/app/components/HomeOffersCarousel";
import HomeShowcasePlaceholders from "@/app/components/HomeShowcasePlaceholders";
import HomeHeroCarousel from "@/app/components/HomeHeroCarousel";
import SubtleScrollRail from "@/app/components/SubtleScrollRail";

type RecentCar = BuyerCarCardData;

function buildSearchUrl(params: { q?: string; make?: string }) {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set("q", params.q.trim());
  if (params.make) searchParams.set("make", params.make);
  const qs = searchParams.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [recent, setRecent] = useState<RecentCar[]>([]);
  const [featured, setFeatured] = useState<BuyerCarCardData[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [makeCounts, setMakeCounts] = useState<{ name: string; count: number }[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchMake, setSearchMake] = useState("");

  useEffect(() => {
    (async () => {
      setFeaturedLoading(true);
      const [{ data: featuredData }, { data: metaData }] = await Promise.all([
        supabase
          .from("cars")
          .select(
            "id, title, price, make, model, year, condition, currency, images, is_sold, listing_type, discount_percent, province, city, mileage, fuel_type, transmission, boost_score, created_at"
          )
          .eq("is_approved", true)
          .eq("is_draft", false)
          .eq("is_sold", false)
          .order("boost_score", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(18),
        supabase
          .from("cars")
          .select("make")
          .eq("is_approved", true)
          .eq("is_draft", false)
          .eq("is_sold", false)
          .limit(800),
      ]);

      setFeatured((featuredData ?? []) as BuyerCarCardData[]);

      const counts: Record<string, number> = {};
      for (const row of (metaData ?? []) as { make: string | null }[]) {
        const m = row.make?.trim();
        if (m) counts[m] = (counts[m] ?? 0) + 1;
      }
      const ranked = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      if (ranked.length > 0) {
        setMakeCounts(ranked);
      } else {
        setMakeCounts([...CAR_MAKES].map((name) => ({ name, count: 0 })));
      }

      setFeaturedLoading(false);
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
            item &&
            typeof (item as RecentCar).id === "string" &&
            typeof (item as RecentCar).title === "string" &&
            typeof (item as RecentCar).price === "number"
        ) as RecentCar[];
        const ids = cleaned.slice(0, 12).map((c) => c.id);
        if (ids.length === 0) return;
        const { data } = await supabase
          .from("cars")
          .select(
            "id, title, price, make, model, year, condition, currency, images, is_sold, listing_type, discount_percent, province, city, mileage, fuel_type, transmission"
          )
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
        const sorted = stillValid
          .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
          .slice(0, 6);
        setRecent(sorted);
        localStorage.setItem("recently-viewed-cars", JSON.stringify(sorted));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const makeStrip = useMemo(() => {
    // Fixed premium strip order; SsangYong removed, EV group + Others at end of list
    return [...MAKE_STRIP_PRIORITY];
  }, []);

  function stripLabel(m: string) {
    if (m === ELECTRIC_HYBRID_STRIP) return t("electricHybrids");
    if (m === OTHER_MAKE) return t("others");
    return m;
  }

  function stripHref(m: string) {
    if (m === ELECTRIC_HYBRID_STRIP) return "/cars?fuelType=electric-hybrid";
    return `/cars?make=${encodeURIComponent(m)}`;
  }

  const searchMakes = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of makeCounts) counts[m.name] = m.count;
    const ranked = sortMakesForDrc(
      makeCounts.length > 0 ? makeCounts.map((m) => m.name) : [...COMMON_MAKES],
      counts
    ).slice(0, 12);
    return [...ranked, OTHER_MAKE].filter((v, i, a) => a.indexOf(v) === i);
  }, [makeCounts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const url = buildSearchUrl({
      q: searchQ || undefined,
      make: searchMake || undefined,
    });
    fetch("/api/analytics/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: searchQ?.trim() || null,
        make: searchMake || null,
      }),
    }).catch(() => {});
    router.push(url);
  }

  return (
    <div className="flex min-w-0 flex-col bg-black">
      {/* Make strip — top, under header */}
      <nav
        className="relative w-full min-w-0 shrink-0 border-y border-[var(--accent)]/25 bg-black"
        aria-label={t("shopByMake")}
      >
        <SubtleScrollRail variant="strip" stepRatio={0.55} className="items-stretch px-7">
          {makeStrip.map((m) => (
            <Link
              key={m}
              href={stripHref(m)}
              className="group flex shrink-0 items-center gap-1.5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)] transition hover:bg-[var(--accent)]/10 sm:px-4 sm:py-3 sm:text-xs"
            >
              <span className="inline-block h-1 w-1 rounded-full bg-[var(--accent)]" aria-hidden />
              {stripLabel(m)}
            </Link>
          ))}
        </SubtleScrollRail>
      </nav>

      {/*
        Hero: full-bleed photo with copy overlaid.
        Mobile: centered brand + actions on dark premium still.
        Desktop: bottom-anchored cinematic overlay (unchanged).
      */}
      <section className="relative min-w-0 overflow-hidden bg-black" aria-label={t("siteName")}>
        <div className="absolute inset-0">
          <HomeHeroCarousel />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(46svh,400px)] w-full max-w-7xl flex-col justify-center px-4 py-5 sm:min-h-[54vh] sm:justify-end sm:px-6 sm:pb-7 sm:pt-14 md:min-h-[60vh] md:pb-8">
          <div className="pointer-events-auto mx-auto w-full max-w-sm text-center sm:mx-0 sm:max-w-none sm:text-left">
            <div className="mb-3 flex flex-col items-center gap-2.5 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="max-w-xl animate-fade-up">
                <p className="font-logo text-[1.05rem] tracking-[0.22em] text-[var(--accent)] drop-shadow-[0_1px_14px_rgba(0,0,0,0.65)] sm:text-xl md:text-2xl">
                  {t("siteName")}
                </p>
                <h1 className="mx-auto mt-1.5 max-w-[19rem] text-[1.0625rem] font-medium leading-snug tracking-tight text-white/92 drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)] sm:mx-0 sm:mt-1.5 sm:max-w-lg sm:text-base md:text-lg">
                  {t("trustedIn")}
                </h1>
              </div>
              <div
                className="flex w-full flex-row gap-1.5 animate-fade-up sm:w-auto sm:max-w-none sm:justify-end sm:gap-2"
                style={{ animationDelay: "50ms" }}
              >
                <Link
                  href="/cars"
                  className="btn-accent min-h-10 flex-1 px-3 py-2 text-[13px] shadow-[0_8px_28px_rgba(0,0,0,0.4)] sm:min-h-11 sm:flex-none sm:px-5 sm:py-3 sm:text-sm sm:shadow-none"
                >
                  {t("browseCars")}
                </Link>
                <Link
                  href="/rent"
                  className="inline-flex min-h-10 flex-1 items-center justify-center border border-white/30 bg-black/50 px-3 py-2 text-[13px] font-medium text-white/95 backdrop-blur-md transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)] sm:min-h-11 sm:flex-none sm:bg-black/40 sm:px-5 sm:py-3 sm:text-sm"
                >
                  {t("rentCars")}
                </Link>
              </div>
            </div>

            <form onSubmit={handleSearch} className="animate-fade-up" style={{ animationDelay: "90ms" }}>
              <div className="flex flex-col gap-1 border border-white/20 bg-black/55 p-1.5 shadow-[0_10px_32px_rgba(0,0,0,0.4)] backdrop-blur-md sm:flex-row sm:items-stretch sm:gap-2 sm:bg-black/55 sm:p-2 sm:shadow-none">
                <input
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="hero-search-field min-h-10 min-w-0 w-full flex-1 border-0 bg-transparent px-2.5 text-center text-white placeholder:text-white/45 focus:outline-none sm:min-h-11 sm:px-3 sm:text-left"
                />
                <div className="flex gap-1 sm:contents">
                  <select
                    value={searchMake}
                    onChange={(e) => setSearchMake(e.target.value)}
                    aria-label={t("shopByMake")}
                    className="hero-search-field min-h-10 min-w-0 flex-1 border border-white/20 bg-black/55 px-2 text-center text-white sm:min-h-11 sm:w-[150px] sm:flex-none sm:bg-black/75 sm:px-2.5 sm:text-left focus:outline-none"
                  >
                    <option value="">{t("shopByMake")}</option>
                    {searchMakes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="hero-search-field min-h-10 shrink-0 bg-red-600 px-4 text-[13px] font-semibold text-white transition hover:bg-red-500 sm:min-h-11 sm:px-5 sm:text-sm"
                  >
                    {t("searchAction")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* New offers */}
      <section className="min-w-0 shrink-0 bg-black pt-4 pb-5 sm:pt-7 sm:pb-10" aria-busy={featuredLoading}>
        <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4 sm:px-5 lg:px-6">
          <div className="mb-2.5 flex items-end justify-between gap-3 sm:mb-4">
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-2xl">
              {t("featuredCars")}
            </h2>
            <Link
              href="/cars"
              className="inline-flex min-h-9 shrink-0 items-center text-[12px] font-medium text-[var(--accent)] hover:underline sm:min-h-10 sm:text-sm"
            >
              {t("viewAllListings")}
            </Link>
          </div>
          {featuredLoading ? (
            <HomeOffersCarousel cars={[]} loading />
          ) : featured.length > 0 ? (
            <HomeOffersCarousel cars={featured} autoPlay />
          ) : (
            <HomeShowcasePlaceholders />
          )}
        </div>
      </section>

      {/* Merged trust strip: how it works + contact */}
      <section className="shrink-0 border-t border-white/10 bg-black py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            <div className="pb-5 sm:pb-0">
              <h2 className="mb-3 text-base font-semibold tracking-tight text-white sm:mb-5 sm:text-xl">
                {t("howItWorks")}
              </h2>
              <FadeInSection stagger className="grid gap-0 sm:grid-cols-3">
                {[
                  { title: t("step1Title"), desc: t("step1Desc"), n: "01" },
                  { title: t("step2Title"), desc: t("step2Desc"), n: "02" },
                  { title: t("step3Title"), desc: t("step3Desc"), n: "03" },
                ].map((step) => (
                  <div
                    key={step.n}
                    className="border-t border-white/10 px-0 py-3 sm:border-t-0 sm:border-l sm:px-4 sm:py-0 first:sm:border-l-0 first:sm:pl-0"
                  >
                    <p className="text-[10px] tracking-[0.2em] text-[var(--accent)] sm:text-[11px]">{step.n}</p>
                    <h3 className="mt-1 text-[0.875rem] font-semibold text-white sm:mt-1.5 sm:text-sm">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/55 sm:mt-1.5 sm:text-xs">{step.desc}</p>
                  </div>
                ))}
              </FadeInSection>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-4 sm:gap-3">
                {[
                  t("browseFree"),
                  t("listEasily"),
                  t("meetSellers"),
                  t("noPlatformFees"),
                ].map((label) => (
                  <p
                    key={label}
                    className="border-t border-[var(--accent)]/40 pt-2 text-[11px] font-medium text-white/80 sm:pt-2.5 sm:text-xs"
                  >
                    {label}
                  </p>
                ))}
              </div>
            </div>

            <div className="border-t border-white/15 pt-5 sm:border-t-0 sm:pt-0 lg:border-l lg:border-white/10 lg:pl-10 lg:pt-0">
              <h2 className="mb-2.5 text-base font-semibold tracking-tight text-white sm:mb-4 sm:text-xl">
                {t("findUsTitle")}
              </h2>
              <p className="mb-3 text-[11px] text-white/50 sm:mb-4 sm:text-[13px]">{t("findUsSubtitle")}</p>
              <FadeInSection stagger className="grid gap-2">
                <a
                  href={SUPPORT_MAILTO}
                  className="flex min-h-[2.85rem] items-center gap-2.5 border border-[var(--accent)]/35 bg-[#0c0c0e] px-3 py-2.5 transition hover:border-[var(--accent)] sm:min-h-[3.25rem] sm:gap-3 sm:px-3.5 sm:py-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--accent)]/30 text-[var(--accent)] sm:h-10 sm:w-10" aria-hidden>
                    @
                  </span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] sm:text-[11px]">
                      {t("email")}
                    </span>
                    <span className="text-[12px] text-white/75 sm:text-[13px]">{SUPPORT_EMAIL}</span>
                  </span>
                </a>
                <Link
                  href="/faq"
                  className="flex min-h-[2.85rem] items-center gap-2.5 border border-[var(--accent)]/35 bg-[#0c0c0e] px-3 py-2.5 transition hover:border-[var(--accent)] sm:min-h-[3.25rem] sm:gap-3 sm:px-3.5 sm:py-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--accent)]/30 text-[var(--accent)] sm:h-10 sm:w-10" aria-hidden>
                    ?
                  </span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] sm:text-[11px]">
                      FAQ
                    </span>
                    <span className="text-[12px] text-white/75 sm:text-[13px]">{t("faq")}</span>
                  </span>
                </Link>
                <Link
                  href="/dashboard/cars/new"
                  className="flex min-h-[2.85rem] items-center gap-2.5 border border-[var(--accent)]/35 bg-[#0c0c0e] px-3 py-2.5 transition hover:border-[var(--accent)] sm:min-h-[3.25rem] sm:gap-3 sm:px-3.5 sm:py-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--accent)]/30 text-[var(--accent)] sm:h-10 sm:w-10" aria-hidden>
                    +
                  </span>
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-[var(--accent)] sm:text-[11px]">
                      {t("listYourCar")}
                    </span>
                    <span className="text-[12px] text-white/75 sm:text-[13px]">{t("listEasilyDesc")}</span>
                  </span>
                </Link>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="hidden shrink-0 border-t border-white/10 bg-black py-5 sm:block sm:py-9">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="mb-3 text-base font-semibold tracking-tight text-white sm:mb-4 sm:text-lg">
              {t("recentlyViewed")}
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
              {recent.map((car) => (
                <BuyerCarCard key={car.id} car={car} compact />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
