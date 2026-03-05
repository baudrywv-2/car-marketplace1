"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { formatPrice } from "@/lib/format-utils";
import CarImagePlaceholder from "@/app/components/CarImagePlaceholder";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import LoadingFallback from "@/app/components/LoadingFallback";

type Car = {
  id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  type: string | null;
  province: string | null;
  city: string | null;
  condition: string | null;
  transmission: string | null;
  fuel_type: string | null;
  images: string[];
  currency?: string | null;
};

function CompareInner() {
  const searchParams = useSearchParams();
  const { t, currency } = useLocale();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idsParam = searchParams.get("ids");
    let ids: string[] = [];
    if (idsParam) {
      ids = idsParam.split(",").map((x) => x.trim()).filter(Boolean);
    } else {
      try {
        const raw = localStorage.getItem("compare-cars");
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          ids = parsed.filter((id) => typeof id === "string");
        }
      } catch {
        // ignore
      }
    }
    ids = Array.from(new Set(ids)).slice(0, 4);
    if (ids.length === 0) {
      setCars([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("cars")
        .select("id, title, price, make, model, year, mileage, type, province, city, condition, transmission, fuel_type, images, currency")
        .in("id", ids)
        .eq("is_approved", true)
        .eq("is_draft", false);
      const list = (data as Car[] | null) ?? [];
      // keep order of ids
      list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      setCars(list);
      setLoading(false);
    })();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("noCarsToCompare")}</p>
        <Link href="/cars" className="mt-4 inline-block font-medium text-[var(--foreground)] underline hover:no-underline">
          ← {t("browseCars")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/cars" className="text-caption font-medium text-[var(--foreground)] hover:underline">
          ← {t("browseCars")}
        </Link>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem("compare-cars");
            } catch {
              // ignore
            }
            window.location.href = "/cars";
          }}
          className="btn-secondary"
        >
          {t("clearCompare")}
        </button>
      </div>

      <h1 className="text-heading mb-4 text-[var(--foreground)]">{t("compareBarTitle")}</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-x-4 text-left text-[10px] sm:text-[11px]">
          <thead>
            <tr>
              <th className="w-32 align-bottom text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"></th>
              {cars.map((car) => (
                <th key={car.id} className="min-w-[140px] align-bottom sm:min-w-[160px]">
                  <Link href={`/cars/${car.id}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius)] bg-[var(--border)]">
                      {car.images?.[0] ? (
                        <OptimizedCarImage src={car.images[0]} alt={car.title} sizes="(max-width: 640px) 140px, 160px" />
                      ) : (
                        <CarImagePlaceholder className="h-full min-h-[80px]" />
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[10px] font-semibold text-[var(--foreground)]">{car.title}</p>
                    <p className="mt-1 text-[9px] text-[var(--muted-foreground)]">
                      {car.make} {car.model}
                      {car.year != null && ` · ${car.year}`}
                    </p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 text-[9px] font-semibold text-[var(--muted-foreground)]">Price</td>
              {cars.map((car) => (
                <td key={car.id} className="py-2 text-[var(--foreground)]">
                  {formatPrice(car.price, currency, car.currency ?? null)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 text-[9px] font-semibold text-[var(--muted-foreground)]">Condition</td>
              {cars.map((car) => (
                <td key={car.id} className="py-2">
                  {car.condition === "new" ? t("new") : t("used")}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 text-[9px] font-semibold text-[var(--muted-foreground)]">Mileage</td>
              {cars.map((car) => (
                <td key={car.id} className="py-2">
                  {car.mileage != null ? `${car.mileage.toLocaleString()} km` : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 text-[9px] font-semibold text-[var(--muted-foreground)]">Type</td>
              {cars.map((car) => (
                <td key={car.id} className="py-2">
                  {car.type || "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 text-[9px] font-semibold text-[var(--muted-foreground)]">Transmission</td>
              {cars.map((car) => (
                <td key={car.id} className="py-2">
                  {car.transmission ? t(car.transmission as "automatic" | "manual") : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 text-[9px] font-semibold text-[var(--muted-foreground)]">Fuel</td>
              {cars.map((car) => (
                <td key={car.id} className="py-2">
                  {car.fuel_type ? t(car.fuel_type as "essence" | "diesel" | "electric" | "hybrid") : "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 text-[9px] font-semibold text-[var(--muted-foreground)]">Location</td>
              {cars.map((car) => (
                <td key={car.id} className="py-2">
                  {[car.province, car.city].filter(Boolean).join(", ") || "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompareInner />
    </Suspense>
  );
}

