"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useToast } from "@/app/contexts/ToastContext";
import { formatPrice, getRentalTiers } from "@/lib/format-utils";
import { readGuestFavorites, GUEST_FAVORITES_KEY } from "@/lib/guest-favorites";
import FavoriteButton from "@/app/components/FavoriteButton";
import ShareButtons from "@/app/components/ShareButtons";
import CarImageGallery from "@/app/components/CarImageGallery";
import VerifiedSellerBadge from "@/app/components/VerifiedSellerBadge";
import CarProductJsonLd from "@/app/components/CarProductJsonLd";
import { formatListedDate } from "@/lib/date-utils";
import { RENTAL_EVENT_TRANSLATION_KEYS, CAR_FEATURES } from "@/lib/constants";

type Car = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  discount_percent?: number | null;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
  type: string | null;
  province: string | null;
  city: string | null;
  country: string | null;
  images: string[];
  currency?: string | null;
  condition?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  owner_phone?: string | null;
  owner_whatsapp?: string | null;
  owner_address?: string | null;
  created_at?: string | null;
  listing_type?: string | null;
  rental_price_per_hour?: number | null;
  rental_price_per_day?: number | null;
  rental_price_per_week?: number | null;
  rental_price_per_month?: number | null;
  rental_currency?: string | null;
  rental_min_hours?: number | null;
  rental_event_type?: string[] | null;
  features?: string[] | null;
  is_sold?: boolean | null;
};

export default function CarDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isPreview = searchParams.get("preview") === "1";
  const { currency, t } = useLocale();
  const toast = useToast();
  const [backUrl, setBackUrl] = useState<string | null>(null);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const [rdvSent, setRdvSent] = useState(false);
  const [rdvLoading, setRdvLoading] = useState(false);
  const [rdvMessage, setRdvMessage] = useState("");
  const [rdvDate, setRdvDate] = useState("");
  const [rdvSuggestedPrice, setRdvSuggestedPrice] = useState("");
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [contact, setContact] = useState<Pick<Car, "owner_phone" | "owner_whatsapp" | "owner_address"> | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [sellerVerification, setSellerVerification] = useState<{
    phone_verified?: boolean;
    id_verified?: boolean;
    dealer_verified?: boolean;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
  }, []);

  useEffect(() => {
    if (!user) {
      setIsFav(readGuestFavorites().includes(id));
      return;
    }
    (async () => {
      const localIds = readGuestFavorites();
      try {
        const res = await fetch("/api/favorites", { credentials: "include" });
        const data = await res.json();
        const serverIds = ((data.carIds ?? []) as string[]).filter(Boolean);
        const serverSet = new Set(serverIds);
        const missing = localIds.filter((x) => !serverSet.has(x));
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
        setIsFav(serverSet.has(id) || localIds.includes(id));
      } catch {
        setIsFav(localIds.includes(id));
      }
    })();
  }, [user, id]);

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("cars")
        .select("id, title, description, price, make, model, year, mileage, type, province, city, country, images, currency, condition, discount_percent, transmission, fuel_type, created_at, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_min_hours, rental_event_type, features, is_sold")
        .eq("id", id);

      if (isPreview) {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", u.id).single();
          if (profile?.role === "admin") {
            setIsAdminPreview(true);
            // Admin preview: load car regardless of approval status
          } else {
            query = query.eq("is_approved", true).eq("is_draft", false);
          }
        } else {
          query = query.eq("is_approved", true).eq("is_draft", false);
        }
      } else {
        query = query.eq("is_approved", true).eq("is_draft", false);
      }

      const { data } = await query.single();
      setCar(data as Car | null);
      const { data: verData } = await supabase.rpc("get_seller_verification", { p_car_id: id });
      const ver = Array.isArray(verData) && verData[0] ? verData[0] : null;
      setSellerVerification(ver);
      setLoading(false);

      if (!isPreview) {
        try {
          await supabase.from("car_views").insert({
            car_id: id,
          });
        } catch {
          // ignore
        }
      }
    }
    load();
  }, [id, isPreview]);

  useEffect(() => {
    if (!car) return;
    try {
      const raw = localStorage.getItem("recently-viewed-cars");
      const parsed = raw ? JSON.parse(raw) : [];
      const list: any[] = Array.isArray(parsed) ? parsed : [];
      const filtered = list.filter((item) => item && item.id !== car.id);
      const entry = {
        id: car.id,
        title: car.title,
        price: car.price,
        make: car.make,
        model: car.model,
        year: car.year,
        condition: car.condition,
        currency: car.currency,
        image: car.images?.[0] ?? null,
      };
      const next = [entry, ...filtered].slice(0, 8);
      localStorage.setItem("recently-viewed-cars", JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [car]);

  useEffect(() => {
    try {
      const url = sessionStorage.getItem("cars-back-url");
      if (url && url.includes("/cars")) setBackUrl(url);
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: unlock } = await supabase
        .from("contact_unlocks")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("car_id", id)
        .maybeSingle();
      if (unlock) {
        setHasUnlocked(true);
        const { data: carData } = await supabase
          .from("cars")
          .select("owner_phone, owner_whatsapp, owner_address")
          .eq("id", id)
          .single();
        setContact(carData ?? null);
      }
    })();
  }, [user, id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">Listing not found.</p>
        <Link href="/cars" className="mt-4 inline-block font-medium text-[var(--foreground)] underline hover:no-underline">
          ← Browse cars
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
      <CarProductJsonLd car={car} />
      {isAdminPreview && (
        <div className="mb-4 rounded-lg border border-amber-500 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Admin preview — this listing is not live yet. Only you can see it.{" "}
          <Link href="/dashboard/admin" className="underline">Back to admin</Link>
        </div>
      )}
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-caption text-[var(--muted-foreground)]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--foreground)] hover:underline">Home</Link>
        <span>/</span>
        <Link href="/cars" className="hover:text-[var(--foreground)] hover:underline">{t("browseCars")}</Link>
        <span>/</span>
        <span className="truncate text-[var(--foreground)]">{car.title}</span>
      </nav>
      {backUrl ? (
        <a href={backUrl} className="link-accent text-caption mb-4 inline-block font-medium">
          {t("backToResults")}
        </a>
      ) : (
        <Link href="/cars" className="text-caption mb-4 inline-block font-medium text-[var(--foreground)] hover:underline">
          ← {t("browseCars")}
        </Link>
      )}

      {car.is_sold && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border-2 border-slate-500 bg-slate-800 px-4 py-3 text-center">
          <span className="text-base font-bold uppercase tracking-wider text-white">{t("sold")}</span>
          <span className="text-sm text-slate-200">— {t("soldListingNote")}</span>
        </div>
      )}

      <div className="card-premium overflow-hidden">
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
          <CarImageGallery images={car.images ?? []} title={car.title} />
          <div className="min-w-0 flex flex-col gap-4">
            {/* Header: title + meta */}
            <div>
              <h1 className="text-heading text-[var(--foreground)] leading-tight">{car.title}</h1>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                {car.listing_type === "rent" ? t("forRent") : car.listing_type === "both" ? t("saleAndRent") : car.condition === "new" ? t("new") : t("used")}
                {car.created_at && ` · ${formatListedDate(car.created_at, (k) => t(k as "listedToday" | "listedYesterday" | "listedDaysAgo"))}`}
              </p>
            </div>

            {/* Pricing: sale + rental in compact blocks */}
            <div className="space-y-2">
              {(car.listing_type === "sale" || car.listing_type === "both" || !car.listing_type) && (
                <div className="flex flex-wrap items-baseline gap-2">
                  {car.discount_percent != null && car.discount_percent > 0 && (
                    <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {Math.round(car.discount_percent)}% off
                    </span>
                  )}
                  <span className="text-lg font-bold tracking-tight text-[var(--accent)]">
                    {car.listing_type === "both" ? `${t("priceFrom")} ` : ""}
                    {car.discount_percent != null && car.discount_percent > 0 ? (
                      <>
                        <span className="mr-1.5 text-sm font-normal text-[var(--muted-foreground)] line-through">
                          {formatPrice(car.price, currency, car.currency)}
                        </span>
                        {formatPrice(car.price * (1 - car.discount_percent / 100), currency, car.currency)}
                      </>
                    ) : (
                      formatPrice(car.price, currency, car.currency)
                    )}
                  </span>
                </div>
              )}
              {(car.listing_type === "rent" || car.listing_type === "both") && (() => {
                const tiers = getRentalTiers(car);
                if (tiers.length === 0) return null;
                const suffix: Record<string, string> = { hour: t("rentPerHour"), day: t("rentPerDay"), week: t("rentPerWeek"), month: t("rentPerMonth") };
                return (
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {car.listing_type === "both" && (
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)]">{t("rentTitle").split(" ")[0]}:</span>
                    )}
                    {tiers.map((tier) => (
                      <span key={tier.period} className="text-[12px] font-semibold text-[var(--accent)]">
                        {formatPrice(tier.price, currency, car.rental_currency)} <span className="font-normal text-[var(--muted-foreground)]">/ {suffix[tier.period]}</span>
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Event tags */}
            {car.rental_event_type && car.rental_event_type.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {car.rental_event_type.map((ev) => (
                  <span key={ev} className="rounded-full bg-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--foreground)]">
                    {t(RENTAL_EVENT_TRANSLATION_KEYS[ev as keyof typeof RENTAL_EVENT_TRANSLATION_KEYS] as Parameters<typeof t>[0])}
                  </span>
                ))}
              </div>
            )}

            {/* Specs: 2-column compact grid */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Make / Model</dt>
                <dd className="font-medium text-[var(--foreground)] truncate">{car.make} {car.model}</dd>
              </div>
              {car.year != null && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Year</dt>
                  <dd className="font-medium text-[var(--foreground)]">{car.year}</dd>
                </div>
              )}
              {car.mileage != null && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Mileage</dt>
                  <dd className="font-medium text-[var(--foreground)]">{car.mileage.toLocaleString()} km</dd>
                </div>
              )}
              {car.type && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Type</dt>
                  <dd className="font-medium text-[var(--foreground)]">{car.type}</dd>
                </div>
              )}
              {car.transmission && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Transmission</dt>
                  <dd className="font-medium text-[var(--foreground)]">{t(car.transmission as "automatic" | "manual")}</dd>
                </div>
              )}
              {car.fuel_type && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Fuel</dt>
                  <dd className="font-medium text-[var(--foreground)]">{t(car.fuel_type as "essence" | "diesel" | "electric" | "hybrid")}</dd>
                </div>
              )}
              {(car.province || car.city || car.country) && (
                <div className="col-span-2 min-w-0">
                  <dt className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Location</dt>
                  <dd className="font-medium text-[var(--foreground)] truncate">{[car.province, car.city, car.country].filter(Boolean).join(", ")}</dd>
                </div>
              )}
            </dl>

            {/* Features pills */}
            {car.features && car.features.length > 0 && (
              <div>
                <span className="mb-1.5 block text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Features</span>
                <div className="flex flex-wrap gap-1.5">
                  {car.features.map((fId) => {
                    const f = CAR_FEATURES.find((x) => x.id === fId);
                    return (
                      <span
                        key={fId}
                        className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-medium text-[var(--foreground)]"
                      >
                        {f ? f.labelEn : fId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact & actions: grouped and clear hierarchy */}
            <div id="contact" className="mt-1 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
              {sellerVerification && (
                <VerifiedSellerBadge
                  phoneVerified={sellerVerification.phone_verified}
                  idVerified={sellerVerification.id_verified}
                  dealerVerified={sellerVerification.dealer_verified}
                />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <FavoriteButton
                  carId={id}
                  isFav={isFav}
                  onToggle={setIsFav}
                  loggedIn={!!user}
                  variant="button"
                />
                <ShareButtons path={`/cars/${id}`} title={car.title} />
              </div>
              {hasUnlocked && contact ? (
                <div className="w-full space-y-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-green-800 dark:text-green-400">{t("sellerContact")}</p>
                  {contact.owner_whatsapp && (
                    <a
                      href={`https://wa.me/${contact.owner_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in your car: ${car.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-accent inline-flex items-center gap-2"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {t("whatsapp")} seller
                    </a>
                  )}
                  <p className="text-[12px]">Phone: {contact.owner_phone || "—"}</p>
                  {!contact.owner_whatsapp && contact.owner_phone && (
                    <a
                      href={`tel:${contact.owner_phone}`}
                      className="btn-primary inline-flex min-h-[40px]"
                    >
                      Call seller
                    </a>
                  )}
                  {contact.owner_address && <p className="text-[12px]">Address: {contact.owner_address}</p>}
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                {user ? (
                  rdvSent ? (
                    <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                      {t("meetingRequestSent")}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const form = document.getElementById("rdv-form");
                        if (form) (form as HTMLDivElement).classList.toggle("hidden");
                      }}
                      className="btn-secondary w-full min-h-[44px]"
                    >
                      {t("requestMeeting")}
                    </button>
                  )
                ) : (
                  <Link href={`/login?next=/cars/${id}`} className="btn-secondary w-full min-h-[44px] text-center">
                    {t("logIn")} — {t("requestMeeting")}
                  </Link>
                )}
              </div>
            </div>
            {user && !rdvSent && (
              <div id="rdv-form" className="mt-3 hidden rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-[12px] mb-2 text-[var(--muted-foreground)]">{t("meetingReassurance")}</p>
                <textarea
                  placeholder="Your message (optional)"
                  value={rdvMessage}
                  onChange={(e) => setRdvMessage(e.target.value)}
                  rows={2}
                  className="input-premium mb-3"
                />
                <label className="text-caption mb-1.5 block">
                  {t("preferredDate")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rdvDate}
                  onChange={(e) => setRdvDate(e.target.value)}
                  required
                  className="input-premium mb-3"
                />
                <label className="text-caption mb-1.5 block">{t("suggestedPriceLabel")}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={t("suggestedPricePlaceholder")}
                  value={rdvSuggestedPrice}
                  onChange={(e) => setRdvSuggestedPrice(e.target.value)}
                  className="input-premium mb-3"
                />
                <button
                  type="button"
                  disabled={rdvLoading}
                  onClick={async () => {
                    if (!rdvDate?.trim()) {
                      toast.error(t("preferredDateRequired"));
                      return;
                    }
                    setRdvLoading(true);
                    const { data: profile } = await supabase
                      .from("profiles")
                      .select("full_name, phone")
                      .eq("id", user.id)
                      .single();
                    const suggestedPriceNum = rdvSuggestedPrice.trim() ? parseFloat(String(rdvSuggestedPrice).replace(/,/g, "")) : null;
                    await supabase.from("rendezvous_requests").insert({
                      buyer_id: user.id,
                      car_id: id,
                      message: rdvMessage.trim() || null,
                      preferred_date: rdvDate || null,
                      suggested_price: !isNaN(suggestedPriceNum as number) && (suggestedPriceNum as number) > 0 ? suggestedPriceNum : null,
                      buyer_email: user.email ?? null,
                      buyer_name: profile?.full_name ?? user.email ?? null,
                      buyer_phone: profile?.phone ?? null,
                      status: "pending",
                    });
                    setRdvLoading(false);
                    setRdvSent(true);
                    toast.success(t("meetingRequestSent"));
                  }}
                  className="btn-primary disabled:opacity-50"
                >
                  {rdvLoading ? t("sending") : t("sendRequest")}
                </button>
              </div>
            )}
          </div>
        </div>
        {car.description && (
          <div className="border-t border-[var(--border)] p-4 sm:p-6">
            <h2 className="text-heading mb-2 text-[var(--foreground)]">Description</h2>
            <p className="text-body whitespace-pre-wrap text-[var(--muted-foreground)]">{car.description}</p>
          </div>
        )}
      </div>

      {/* Sticky CTA on mobile */}
      <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-[var(--border)] bg-[var(--background)] p-4 sm:hidden">
        <a href="#contact" className="btn-accent flex-1 text-center">
          {(car.listing_type === "rent" || car.listing_type === "both") ? t("rentThisCar") : t("requestMeeting")}
        </a>
        <FavoriteButton
          carId={id}
          isFav={isFav}
          onToggle={setIsFav}
          loggedIn={!!user}
          variant="button"
          className="shrink-0"
        />
      </div>
    </div>
  );
}
