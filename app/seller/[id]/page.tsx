"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { formatPrice, getRentalTiers } from "@/lib/format-utils";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";
import CarImagePlaceholder from "@/app/components/CarImagePlaceholder";
import FavoriteButton from "@/app/components/FavoriteButton";
import { readGuestFavorites, GUEST_FAVORITES_KEY } from "@/lib/guest-favorites";

type Car = {
  id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number | null;
  condition?: string | null;
  currency?: string | null;
  images: string[];
  listing_type?: string | null;
  rental_price_per_hour?: number | null;
  rental_price_per_day?: number | null;
  rental_price_per_week?: number | null;
  rental_price_per_month?: number | null;
  rental_currency?: string | null;
};

type Profile = { id: string; full_name: string | null; company_name: string | null };

export default function SellerListingsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { t, currency } = useLocale();
  const [cars, setCars] = useState<Car[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
  }, []);

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
        setFavoriteIds(new Set([...serverIds, ...localIds]));
      } catch {
        setFavoriteIds(new Set(localIds));
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    async function load() {
      setLoading(true);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, company_name")
        .eq("id", id)
        .single();
      setProfile((profileData as Profile) ?? null);

      const { data: carsData } = await supabase
        .from("cars")
        .select("id, title, price, make, model, year, condition, currency, images, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency")
        .eq("owner_id", id)
        .eq("is_approved", true)
        .eq("is_draft", false)
        .order("created_at", { ascending: false });
      setCars((carsData as Car[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  function getCarPriceLabel(car: Car): string {
    const lt = car.listing_type ?? "sale";
    if (lt === "rent") {
      const tiers = getRentalTiers(car);
      if (tiers.length > 0) {
        const cur = car.rental_currency ?? "USD";
        const suffix: Record<string, string> = { hour: "hr", day: "day", week: "wk", month: "mo" };
        return tiers.map((t) => `${formatPrice(t.price, currency, cur)}/${suffix[t.period]}`).join(" · ");
      }
    }
    return formatPrice(car.price, currency, car.currency ?? null);
  }

  const displayName = profile?.company_name || profile?.full_name || t("seller");

  if (!id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("noListings")}</p>
        <Link href="/cars" className="link-accent mt-4 inline-block">{t("browseCars")}</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/cars" className="text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            ← {t("browseCars")}
          </Link>
          <h1 className="mt-1 text-heading text-[var(--foreground)]">
            {displayName}
          </h1>
          <p className="mt-0.5 text-caption text-[var(--muted-foreground)]">
            {cars.length} {t("carsListed")}
          </p>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] py-14 px-6 text-center">
          <p className="text-body text-[var(--muted-foreground)]">{t("noListings")}</p>
          <Link href="/cars" className="btn-accent mt-4 inline-block">{t("browseCars")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}`}
              className="card-compact card-hover-lift card-img-zoom block overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-[var(--border)]">
                {car.images?.[0] ? (
                  <OptimizedCarImage src={car.images[0]} alt={car.title} sizes="(max-width: 640px) 50vw, 25vw" />
                ) : (
                  <CarImagePlaceholder className="h-full min-h-[80px]" />
                )}
                <FavoriteButton
                  carId={car.id}
                  isFav={favoriteIds.has(car.id)}
                  onToggle={(next) => setFavoriteIds((prev) => {
                    const s = new Set(prev);
                    if (next) s.add(car.id); else s.delete(car.id);
                    return s;
                  })}
                  loggedIn={!!user}
                  variant="icon"
                />
              </div>
              <div className="p-2.5">
                <p className="truncate text-[10px] font-semibold text-[var(--foreground)]">{car.title}</p>
                <p className="mt-0.5 text-[9px] text-[var(--accent)] font-semibold">{getCarPriceLabel(car)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
