"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { formatPrice } from "@/lib/format-utils";
import { readGuestFavorites, GUEST_FAVORITES_KEY } from "@/lib/guest-favorites";
import FavoriteButton from "@/app/components/FavoriteButton";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import CarImagePlaceholder from "@/app/components/CarImagePlaceholder";

type Car = {
  id: string;
  title: string;
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
};

export default function FavoritesPage() {
  const { t, currency } = useLocale();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const localIds = readGuestFavorites();

      let ids: string[] = localIds;
      if (user) {
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

          ids = Array.from(new Set([...serverIds, ...localIds]));
        } catch {
          ids = localIds;
        }
      }

      setFavoriteIds(new Set(ids));
      if (ids.length === 0) {
        setCars([]);
        setLoading(false);
        return;
      }
      const { data: carsData } = await supabase
        .from("cars")
        .select("id, title, price, make, model, year, type, province, city, images, currency, condition")
        .in("id", ids)
        .eq("is_approved", true)
        .eq("is_draft", false);
      const list = (carsData ?? []) as Car[];
      setCars(list);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/cars" className="link-accent text-small mb-6 inline-block font-medium">
        ← {t("browseCars")}
      </Link>
      <h1 className="text-heading text-[var(--foreground)]">{t("myFavorites")}</h1>
      {cars.length === 0 ? (
        <p className="mt-4 text-body text-[var(--muted-foreground)]">
          {t("favoritesEmpty")}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}`}
              className="card-premium card-hover-lift card-img-zoom overflow-hidden"
            >
              <div className="relative">
                <div className="aspect-video bg-[var(--border)]">
                  {car.images?.[0] ? (
                    <OptimizedCarImage src={car.images[0]} alt={car.title} sizes="(max-width: 640px) 50vw, 33vw" />
                  ) : (
                    <CarImagePlaceholder className="h-full min-h-[80px]" />
                  )}
                </div>
                <FavoriteButton
                  carId={car.id}
                  isFav={favoriteIds.has(car.id)}
                  onToggle={(next) => {
                    setFavoriteIds((prev) => {
                      const s = new Set(prev);
                      if (next) s.add(car.id);
                      else s.delete(car.id);
                      return s;
                    });
                    if (!next) setCars((prev) => prev.filter((c) => c.id !== car.id));
                  }}
                  loggedIn={!!user}
                  variant="icon"
                />
              </div>
              <div className="p-4">
                <p className="font-semibold text-[var(--foreground)]">{car.title}</p>
                <p className="text-caption mt-1">
                  {car.condition === "new" ? t("new") : t("used")}
                  {car.year != null && ` · ${car.year}`}
                </p>
                <p className="mt-2 font-semibold text-[var(--accent)]">
                  {formatPrice(car.price, currency, car.currency)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
