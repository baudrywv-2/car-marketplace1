"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { COMMON_MAKES, OTHER_MAKE } from "@/lib/constants";
import FadeInSection from "@/app/components/FadeInSection";
import BuyerCarCard, { type BuyerCarCardData } from "@/app/components/BuyerCarCard";

type RecentCar = BuyerCarCardData;

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

export default function HomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [recent, setRecent] = useState<RecentCar[]>([]);
  const [featured, setFeatured] = useState<BuyerCarCardData[]>([]);
  const [popularMakes, setPopularMakes] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchMake, setSearchMake] = useState("");
  const [searchMinPrice, setSearchMinPrice] = useState("");
  const [searchMaxPrice, setSearchMaxPrice] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: metaData }, { data: featuredData }] = await Promise.all([
        supabase.from("cars").select("make").eq("is_approved", true).eq("is_draft", false).limit(500),
        supabase
          .from("cars")
          .select("id, title, price, make, model, year, condition, currency, images, is_sold, listing_type, discount_percent, province, city")
          .eq("is_approved", true)
          .eq("is_draft", false)
          .eq("is_sold", false)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      const meta = (metaData ?? []) as { make: string | null }[];
      const makeCounts: Record<string, number> = {};
      meta.forEach((r) => {
        if (r.make) makeCounts[r.make] = (makeCounts[r.make] ?? 0) + 1;
      });
      const otherCount = meta.filter((r) => !r.make || !COMMON_MAKES.includes(r.make)).length;
      const topMakes = Object.entries(makeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([m]) => m);
      setPopularMakes([...topMakes, ...(otherCount > 0 ? [OTHER_MAKE] : [])]);
      setFeatured((featuredData ?? []) as BuyerCarCardData[]);
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
          .select("id, title, price, make, model, year, condition, currency, images, is_sold, listing_type, discount_percent, province, city")
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

  const makesToShow = popularMakes.length > 0 ? popularMakes : POPULAR_MAKES;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const url = buildSearchUrl({
      q: searchQ || undefined,
      make: searchMake || undefined,
      minPrice: searchMinPrice || undefined,
      maxPrice: searchMaxPrice || undefined,
    });
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
    <div className="flex flex-col bg-[var(--background)] md:flex-1">
      <section className="relative flex min-h-[50vh] flex-col overflow-hidden border-b border-[var(--border)] md:min-h-0 md:flex-1">
        <div className="absolute inset-0" aria-hidden>
          <Image
            src="https://unsplash.com/photos/ZZlWF_nRyz0/download?force=true&w=1600&q=85"
            alt=""
            fill
            className="animate-hero-zoom object-cover object-center md:object-[center_35%]"
            sizes="100vw"
            priority
            fetchPriority="high"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-[var(--background)] md:from-black/75 md:via-black/45 md:to-[var(--background)]"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 md:py-12 lg:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="max-w-xl animate-fade-up md:max-w-2xl lg:max-w-3xl">
              <Link
                href="/"
                className="mb-2 inline-flex items-center font-logo text-sm tracking-wide text-[var(--accent)] transition-opacity hover:opacity-90 md:mb-3 md:text-base lg:text-lg"
                aria-label={t("backToHome")}
              >
                <span className="opacity-60">&gt;</span> {t("siteName")}
              </Link>
              <h1 className="font-mono text-[1.35rem] font-bold leading-[1.15] tracking-[-0.06em] text-white sm:text-[1.5rem] md:text-[2.35rem] lg:text-[2.75rem] xl:text-[3rem]">
                {t("homeTitle")}
              </h1>
              <p className="mt-3 font-mono text-xs leading-relaxed text-white/70 md:mt-4 md:text-sm lg:text-base">
                {t("trustedIn")}
              </p>
              <p className="mt-2 max-w-lg font-mono text-[11px] leading-relaxed text-white/55 md:text-xs">
                {t("homeSubtitle")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 md:mt-7 md:gap-3">
                <Link href="/cars" className="btn-accent shrink-0 px-4 py-2 text-sm md:px-5 md:py-2.5 md:text-base">
                  {t("browseCars")}
                </Link>
                <Link href="/rent" className="btn-rent shrink-0 px-4 py-2 text-sm md:px-5 md:py-2.5 md:text-base">
                  {t("rentCars")}
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-white/45">
                <Link href="/dashboard/cars/new" className="underline-offset-2 hover:text-white/80 hover:underline">
                  {t("listYourCar")}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSearch} className="w-full animate-fade-up lg:max-w-sm lg:shrink-0" style={{ animationDelay: "80ms" }}>
              <div className="rounded border border-white/10 bg-black/40 p-4 font-mono backdrop-blur-sm md:p-5">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="input-premium min-h-[40px] w-full border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40"
                  />
                  <select
                    value={searchMake}
                    onChange={(e) => setSearchMake(e.target.value)}
                    className="input-premium min-h-[40px] w-full border-white/10 bg-white/5 text-sm text-white"
                  >
                    <option value="">{t("shopByMake")}</option>
                    {makesToShow.map((m) => (
                      <option key={m} value={m} className="text-[var(--foreground)]">
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder={t("minPrice")}
                      value={searchMinPrice}
                      onChange={(e) => setSearchMinPrice(e.target.value)}
                      className="input-premium min-h-[40px] w-full border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40"
                    />
                    <input
                      type="number"
                      placeholder={t("maxPrice")}
                      value={searchMaxPrice}
                      onChange={(e) => setSearchMaxPrice(e.target.value)}
                      className="input-premium min-h-[40px] w-full border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40"
                    />
                  </div>
                  <button type="submit" className="btn-accent min-h-[40px] w-full px-5 text-sm">
                    {t("searchAction")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="shrink-0 border-b border-[var(--border)] py-4 sm:py-5 md:py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
            <h2 className="text-subheading shrink-0 font-mono text-[var(--foreground)]">
              <span className="text-[var(--accent)] opacity-80">&gt;</span> {t("shopByMake")}
            </h2>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {makesToShow.map((m) => (
                <Link
                  key={m}
                  href={`/cars?make=${encodeURIComponent(m)}`}
                  className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-mono text-[var(--foreground)] transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
                >
                  {m}
                </Link>
              ))}
              <Link
                href="/cars"
                className="rounded border border-[var(--accent)]/40 bg-[var(--accent-muted)] px-3 py-2 text-xs font-mono text-[var(--accent)] transition hover:border-[var(--accent)]"
              >
                {t("browseCars")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="shrink-0 border-b border-[var(--border)] py-6 sm:py-8 md:py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeInSection>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-subheading font-mono text-[var(--foreground)]">
                  <span className="text-[var(--accent)] opacity-80">&gt;</span> {t("featuredCars")}
                </h2>
                <Link href="/cars" className="text-[12px] font-medium text-[var(--accent)] hover:underline">
                  {t("viewAllListings")}
                </Link>
              </div>
            </FadeInSection>
            <FadeInSection stagger delay={80} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {featured.map((car) => (
                <BuyerCarCard key={car.id} car={car} />
              ))}
            </FadeInSection>
          </div>
        </section>
      )}

      <section className="shrink-0 border-b border-[var(--border)] py-6 sm:py-8 md:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeInSection>
            <h2 className="text-subheading mb-5 font-mono text-[var(--foreground)]">
              <span className="text-[var(--accent)] opacity-80">&gt;</span> {t("howItWorks")}
            </h2>
          </FadeInSection>
          <FadeInSection stagger delay={60} className="grid gap-4 sm:grid-cols-3">
            {[
              { title: t("step1Title"), desc: t("step1Desc"), n: "01" },
              { title: t("step2Title"), desc: t("step2Desc"), n: "02" },
              { title: t("step3Title"), desc: t("step3Desc"), n: "03" },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
                <p className="font-mono text-[11px] text-[var(--accent)]">{step.n}</p>
                <h3 className="mt-2 font-mono text-sm font-semibold text-[var(--foreground)]">{step.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">{step.desc}</p>
              </div>
            ))}
          </FadeInSection>
        </div>
      </section>

      <section className="shrink-0 border-b border-[var(--border)] py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeInSection>
            <h2 className="text-subheading mb-4 font-mono text-[var(--foreground)]">
              <span className="text-[var(--accent)] opacity-80">&gt;</span> {t("whyUseUs")}
            </h2>
          </FadeInSection>
          <FadeInSection stagger delay={60} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: t("browseFree"), desc: t("browseFreeDesc") },
              { title: t("listEasily"), desc: t("listEasilyDesc") },
              { title: t("meetSellers"), desc: t("meetSellersDesc") },
              { title: t("noPlatformFees"), desc: t("noPlatformFeesDesc") },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3.5">
                <p className="text-[12px] font-semibold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">{item.desc}</p>
              </div>
            ))}
          </FadeInSection>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="shrink-0 border-b border-[var(--border)] py-4 sm:py-6 md:py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <FadeInSection>
              <h2 className="text-subheading mb-3 font-mono text-[var(--foreground)]">
                <span className="text-[var(--accent)] opacity-80">&gt;</span> {t("recentlyViewed")}
              </h2>
            </FadeInSection>
            <FadeInSection stagger delay={60} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {recent.map((car) => (
                <BuyerCarCard key={car.id} car={car} compact />
              ))}
            </FadeInSection>
          </div>
        </section>
      )}
    </div>
  );
}
