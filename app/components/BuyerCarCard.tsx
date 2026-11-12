"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";
import { formatPrice, getBestRentalPrice, getRentalTiers } from "@/lib/format-utils";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import CarImagePlaceholder from "@/app/components/CarImagePlaceholder";
import FavoriteButton from "@/app/components/FavoriteButton";

export type BuyerCarCardData = {
  id: string;
  title: string;
  price: number;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  condition?: string | null;
  currency?: string | null;
  images?: string[] | null;
  image?: string | null;
  is_sold?: boolean | null;
  listing_type?: string | null;
  discount_percent?: number | null;
  province?: string | null;
  city?: string | null;
  mileage?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  rental_price_per_hour?: number | null;
  rental_price_per_day?: number | null;
  rental_price_per_week?: number | null;
  rental_price_per_month?: number | null;
  rental_currency?: string | null;
};

type Props = {
  car: BuyerCarCardData;
  compact?: boolean;
  /** First visible cards only — improves LCP without loading every thumb eagerly. */
  priority?: boolean;
  isFav?: boolean;
  loggedIn?: boolean;
  onFavToggle?: (next: boolean) => void;
  showFavorite?: boolean;
  compareChecked?: boolean;
  onCompareToggle?: (checked: boolean) => void;
  onNavigate?: () => void;
  className?: string;
};

function fuelLabel(t: (k: string) => string, fuel?: string | null) {
  if (!fuel) return null;
  if (fuel === "essence" || fuel === "diesel" || fuel === "electric" || fuel === "hybrid") {
    return t(fuel);
  }
  return fuel;
}

function transmissionLabel(t: (k: string) => string, tr?: string | null) {
  if (!tr) return null;
  if (tr === "automatic" || tr === "manual") return t(tr);
  return tr;
}

export default function BuyerCarCard({
  car,
  compact,
  priority = false,
  isFav,
  loggedIn,
  onFavToggle,
  showFavorite,
  compareChecked,
  onCompareToggle,
  onNavigate,
  className = "",
}: Props) {
  const { t, currency } = useLocale();
  const img = car.image ?? car.images?.[0] ?? null;
  const location = [car.city, car.province].filter(Boolean).join(", ");
  const make = car.make?.trim() || null;
  const model = car.model?.trim() || null;
  const listingType = car.listing_type ?? "sale";
  const discountPct = car.discount_percent ?? 0;
  const discount =
    discountPct > 0 && listingType !== "rent"
      ? t("discountOffLabel").replace("{n}", String(Math.round(discountPct)))
      : null;

  const rentBadge =
    listingType === "rent" ? t("forRent") : listingType === "both" ? t("saleAndRent") : null;

  let priceNode: React.ReactNode;
  let secondaryPrice: React.ReactNode = null;
  if (listingType === "rent") {
    const tiers = getRentalTiers(car);
    const cur = car.rental_currency ?? "USD";
    if (tiers.length > 0) {
      const suffix: Record<string, string> = { hour: "hr", day: "day", week: "wk", month: "mo" };
      priceNode = tiers.map((tier) => `${formatPrice(tier.price, currency, cur)}/${suffix[tier.period]}`).join(" · ");
    } else {
      priceNode = formatPrice(getBestRentalPrice(car) || car.price, currency, cur);
    }
  } else if (discountPct > 0) {
    const orig = car.price;
    const disc = orig * (1 - discountPct / 100);
    secondaryPrice = (
      <span className="text-[10px] font-normal text-white/55">
        {formatPrice(orig, currency, car.currency ?? null)}
      </span>
    );
    priceNode = formatPrice(disc, currency, car.currency ?? null);
  } else {
    priceNode = formatPrice(car.price, currency, car.currency ?? null);
  }

  const specs: { label: string; value: string }[] = [];
  if (car.year != null) specs.push({ label: t("year"), value: String(car.year) });
  if (car.condition) {
    specs.push({ label: t("condition"), value: car.condition === "new" ? t("new") : t("used") });
  }
  if (car.mileage != null && car.mileage > 0) {
    specs.push({ label: t("mileage"), value: `${car.mileage.toLocaleString()} km` });
  }
  const fuel = fuelLabel(t as (k: string) => string, car.fuel_type);
  if (fuel) specs.push({ label: t("shopByFuel"), value: fuel });
  const tr = transmissionLabel(t as (k: string) => string, car.transmission);
  if (tr) specs.push({ label: t("shopByTransmission"), value: tr });
  if (location) specs.push({ label: t("location"), value: location });

  const shownSpecs = compact ? specs.slice(0, 2) : specs.slice(0, 3);

  return (
    <article
      className={`listing-card group relative flex h-full min-w-0 flex-col overflow-hidden bg-black ${className}`}
    >
      <Link
        href={`/cars/${car.id}`}
        className="flex min-h-0 flex-1 flex-col outline-none"
        onClick={onNavigate}
      >
        <div
          className={`listing-card-media relative overflow-hidden bg-[#1a1a1c] ${
            compact ? "aspect-[2.4/1] sm:aspect-[5/3]" : "aspect-[2/1] sm:aspect-[4/3]"
          }`}
        >
          {img ? (
            <OptimizedCarImage
              src={img}
              alt={car.title}
              thumbWidth={compact ? 280 : 360}
              quality={60}
              priority={priority}
              sizes={compact ? "(max-width: 640px) 34vw, 12vw" : "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"}
            />
          ) : (
            <CarImagePlaceholder className="h-full min-h-[28px]" />
          )}
          {(car.is_sold || rentBadge || discount) && (
            <div className="absolute left-0.5 top-0.5 z-[1] flex flex-wrap gap-0.5 sm:left-1.5 sm:top-1.5 sm:gap-1">
              {car.is_sold && (
                <span className="rounded-sm bg-slate-900/90 px-1 py-px text-[7px] font-bold uppercase tracking-wide text-white sm:px-1.5 sm:py-0.5 sm:text-[9px]">
                  {t("sold")}
                </span>
              )}
              {rentBadge && (
                <span className="rounded-sm bg-[var(--accent)] px-1 py-px text-[7px] font-semibold text-black sm:px-1.5 sm:py-0.5 sm:text-[9px]">
                  {rentBadge}
                </span>
              )}
              {discount && (
                <span className="rounded-sm bg-emerald-600 px-1 py-px text-[7px] font-semibold text-white sm:px-1.5 sm:py-0.5 sm:text-[9px]">
                  {discount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="h-px w-full bg-[var(--accent)]/35" aria-hidden />

        <div
          className={`flex flex-1 flex-col bg-black ${
            compact
              ? "px-1 pb-0.5 pt-0.5 sm:px-2 sm:pb-2 sm:pt-1.5"
              : "px-1 pb-1 pt-0.5 sm:px-2.5 sm:pb-2.5 sm:pt-2"
          } ${onCompareToggle ? (compact ? "pb-5 sm:pb-8" : "pb-6 sm:pb-9") : ""}`}
        >
          {make && (
            <p
              className={`hidden font-medium uppercase tracking-[0.1em] text-[var(--accent)] sm:block ${
                compact ? "sm:text-[10px]" : "sm:text-[11px]"
              }`}
            >
              {make}
            </p>
          )}
          <p
            className={`font-semibold uppercase leading-tight tracking-wide text-white line-clamp-1 ${
              compact ? "text-[9px] sm:text-[12px]" : "text-[10px] sm:text-[13px]"
            } ${car.is_sold ? "opacity-70" : ""}`}
          >
            {model || car.title}
          </p>

          <div className="mt-px sm:mt-0.5">
            {secondaryPrice && (
              <p className="mb-px hidden sm:block [&_span]:text-[8px] sm:[&_span]:text-[10px]">{secondaryPrice}</p>
            )}
            <p
              className={`font-semibold tabular-nums leading-none text-[var(--accent)] ${
                compact ? "text-[10px] sm:text-[13px]" : "text-[11px] sm:text-[14px]"
              }`}
            >
              {priceNode}
            </p>
          </div>

          {shownSpecs.length > 0 && (
            <dl className="mt-1.5 hidden border-t border-white/10 sm:block">
              {shownSpecs.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-1 border-b border-white/10 last:border-b-0"
                >
                  <dt
                    className={`text-[9px] leading-snug text-[var(--accent)]/80 ${
                      compact ? "py-1" : "py-1.5"
                    }`}
                  >
                    {row.label}
                  </dt>
                  <dd
                    className={`text-right text-[9px] font-medium leading-snug text-white/90 line-clamp-1 ${
                      compact ? "py-1" : "py-1.5"
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Link>

      {showFavorite && onFavToggle != null && (
        <div className="absolute right-0.5 top-0.5 z-[2] scale-90 sm:right-1.5 sm:top-1.5 sm:scale-100">
          <FavoriteButton
            carId={car.id}
            isFav={!!isFav}
            onToggle={onFavToggle}
            loggedIn={!!loggedIn}
            variant="icon"
          />
        </div>
      )}

      {onCompareToggle && (
        <label
          className={`absolute z-[2] flex cursor-pointer items-center gap-0.5 rounded border border-white/15 bg-black/90 text-white/70 backdrop-blur-sm hover:border-[var(--accent)]/50 hover:text-white ${
            compact
              ? "bottom-0.5 right-0.5 min-h-6 px-1 py-px text-[8px] sm:bottom-1.5 sm:right-1.5 sm:min-h-7 sm:gap-1 sm:px-1.5 sm:text-[10px]"
              : "bottom-1 right-1 min-h-6 gap-1 px-1.5 py-0.5 text-[9px] sm:bottom-2 sm:right-2 sm:min-h-8 sm:text-[10px]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={!!compareChecked}
            onChange={(e) => onCompareToggle(e.target.checked)}
            className="rounded border-white/30"
          />
          {t("compare")}
        </label>
      )}
    </article>
  );
}
