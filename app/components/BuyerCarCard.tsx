"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";
import { formatPrice } from "@/lib/format-utils";
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
  className?: string;
};

export default function BuyerCarCard({
  car,
  compact,
  isFav,
  loggedIn,
  onFavToggle,
  showFavorite,
  compareChecked,
  onCompareToggle,
  className = "",
}: Props) {
  const { t, currency } = useLocale();
  const img = car.image ?? car.images?.[0] ?? null;
  const location = [car.city, car.province].filter(Boolean).join(", ");
  const discount =
    car.discount_percent != null && car.discount_percent > 0
      ? t("discountOffLabel").replace("{n}", String(car.discount_percent))
      : null;

  return (
    <article
      className={`group relative overflow-hidden ${
        compact
          ? "card-compact rounded-lg border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--accent)]/50"
          : "card-premium card-hover-lift card-img-zoom"
      } ${className}`}
    >
      <Link href={`/cars/${car.id}`} className="block">
        <div className={`relative bg-[var(--border)] ${compact ? "aspect-[4/3]" : "aspect-video"}`}>
          {img ? (
            <OptimizedCarImage
              src={img}
              alt={car.title}
              sizes={compact ? "(max-width: 640px) 50vw, 16vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            />
          ) : (
            <CarImagePlaceholder className={`h-full ${compact ? "min-h-[60px]" : "min-h-[80px]"}`} />
          )}
          {(car.is_sold || car.listing_type === "rent" || discount) && (
            <div className="absolute left-2 top-2 z-[1] flex flex-wrap gap-1">
              {car.is_sold && (
                <span className="rounded border border-white/70 bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t("sold")}
                </span>
              )}
              {car.listing_type === "rent" && (
                <span className="rounded bg-[var(--accent-red)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {t("rentCars")}
                </span>
              )}
              {discount && (
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {discount}
                </span>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className={compact ? "p-2.5" : "p-3.5"}>
          <p
            className={`font-mono font-semibold leading-snug text-[var(--foreground)] line-clamp-2 ${
              compact ? "text-[12px]" : "text-[13px] sm:text-sm"
            } ${car.is_sold ? "opacity-75" : ""}`}
          >
            {car.title}
          </p>
          <p className={`mt-1 font-mono text-[var(--muted-foreground)] ${compact ? "text-[11px]" : "text-xs"}`}>
            {(car.condition === "new" ? t("new") : t("used"))}
            {car.year != null && ` · ${car.year}`}
            {location ? ` · ${location}` : ""}
          </p>
          <p className={`font-mono font-semibold text-[var(--accent)] ${compact ? "mt-1.5 text-[12px]" : "mt-2 text-sm"}`}>
            {formatPrice(car.price, currency, car.currency ?? null)}
          </p>
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
          className="absolute bottom-2 right-2 z-[2] flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)]/95 px-2 py-1 text-[11px] text-[var(--muted-foreground)] backdrop-blur-sm hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={!!compareChecked}
            onChange={(e) => onCompareToggle(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          {t("compare")}
        </label>
      )}
    </article>
  );
}
