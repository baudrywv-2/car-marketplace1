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

  const shownSpecs = compact ? specs.slice(0, 3) : specs.slice(0, 4);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-md bg-black ${className}`}
    >
      <Link
        href={`/cars/${car.id}`}
        className="flex min-h-0 flex-1 flex-col"
        onClick={onNavigate}
      >
        <div className={`relative bg-[#1a1a1c] ${compact ? "aspect-[3/2] sm:aspect-[5/4]" : "aspect-[4/3]"}`}>
          {img ? (
            <OptimizedCarImage
              src={img}
              alt={car.title}
              sizes={compact ? "(max-width: 640px) 54vw, 16vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            />
          ) : (
            <CarImagePlaceholder className={`h-full ${compact ? "min-h-[48px]" : "min-h-[80px]"}`} />
          )}
          {(car.is_sold || rentBadge || discount) && (
            <div className="absolute left-1.5 top-1.5 z-[1] flex flex-wrap gap-1 sm:left-2 sm:top-2">
              {car.is_sold && (
                <span className="rounded-sm bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  {t("sold")}
                </span>
              )}
              {rentBadge && (
                <span className="rounded-sm bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-semibold text-black">
                  {rentBadge}
                </span>
              )}
              {discount && (
                <span className="rounded-sm bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  {discount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="h-px w-full bg-[var(--accent)]/40" aria-hidden />

        <div
          className={`flex flex-1 flex-col bg-black ${
            compact ? "px-2 pb-2 pt-1.5 sm:px-2.5 sm:pb-2.5 sm:pt-2" : "px-2.5 pb-2.5 pt-2"
          } ${onCompareToggle ? "pb-9" : ""}`}
        >
          {make && (
            <p
              className={`font-medium uppercase tracking-[0.12em] text-[var(--accent)] ${
                compact ? "text-[10px] sm:text-[11px]" : "text-[11px]"
              }`}
            >
              {make}
            </p>
          )}
          <p
            className={`mt-0.5 font-semibold uppercase leading-snug tracking-wide text-white line-clamp-2 ${
              compact ? "text-[12px] sm:text-[13px]" : "text-sm"
            } ${car.is_sold ? "opacity-70" : ""}`}
          >
            {model || car.title}
          </p>

          <div className={compact ? "mt-1 sm:mt-1.5" : "mt-1.5"}>
            {secondaryPrice && <p className="mb-0.5">{secondaryPrice}</p>}
            <p
              className={`font-semibold tabular-nums text-[var(--accent)] ${
                compact ? "text-[13px] sm:text-[14px]" : "text-[15px]"
              }`}
            >
              {priceNode}
            </p>
          </div>

          {shownSpecs.length > 0 && (
            <dl className={`border-t border-white/10 ${compact ? "mt-1.5 sm:mt-2" : "mt-2"}`}>
              {shownSpecs.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-1.5 border-b border-white/10 last:border-b-0 sm:gap-2"
                >
                  <dt
                    className={`text-[10px] leading-snug text-[var(--accent)]/80 ${
                      compact ? "py-1 sm:py-2" : "py-2"
                    }`}
                  >
                    {row.label}
                  </dt>
                  <dd
                    className={`text-right text-[10px] font-medium leading-snug text-white/90 line-clamp-2 ${
                      compact ? "py-1 sm:py-2" : "py-2"
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
        <div className="absolute right-2 top-2 z-[2]">
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
          className="absolute bottom-2 right-2 z-[2] flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md border border-white/15 bg-black/90 px-2 py-1 text-[10px] text-white/70 backdrop-blur-sm hover:border-[var(--accent)]/50 hover:text-white"
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
