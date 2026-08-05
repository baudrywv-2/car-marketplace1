"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DRC_LOCATIONS, CAR_TYPES, CAR_MAKES, OTHER_MAKE, CURRENCIES, CONDITIONS, TRANSMISSIONS, FUEL_TYPES, LISTING_TYPES, RENTAL_EVENT_TYPES } from "@/lib/constants";
import ImageUpload from "@/app/components/ImageUpload";
import ListingFeaturePicker from "@/app/components/ListingFeaturePicker";
import {
  buildListingPayload,
  hasAtLeastOneRentalPrice,
  validateListing,
} from "@/lib/listing-validation";

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const initialDiscountRef = useRef<number | null>(null);
  const [profile, setProfile] = useState<{ phone: string | null; whatsapp: string | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDraft, setIsDraft] = useState(true);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    make: "",
    make_other: "",
    model: "",
    year: "",
    mileage: "",
    currency: "USD",
    condition: "used",
    discount_percent: "",
    province: "",
    city: "",
    country: "",
    type: "",
    transmission: "",
    fuel_type: "",
    images: [] as string[],
    owner_address: "",
    owner_phone: "",
    owner_whatsapp: "",
    listing_type: "sale" as "sale" | "rent" | "both",
    rental_price_per_hour: "",
    rental_price_per_day: "",
    rental_price_per_week: "",
    rental_price_per_month: "",
    rental_currency: "USD",
    rental_min_hours: "",
        rental_event_type: [] as string[],
        features: [] as string[],
  });

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.replace(`/login?next=${encodeURIComponent(`/dashboard/cars/${id}/edit`)}`);
        return;
      }
      const { syncSellerProfileFromAuth } = await import("@/lib/seller-profile");
      const synced = await syncSellerProfileFromAuth(supabase, u);
      const p = { phone: synced.phone, whatsapp: synced.whatsapp };
      setProfile(p);

      const { data, error: err } = await supabase
        .from("cars")
        .select("id, title, description, price, make, model, year, mileage, currency, condition, discount_percent, province, city, country, type, transmission, fuel_type, images, owner_phone, owner_whatsapp, owner_address, listing_type, rental_price_per_hour, rental_price_per_day, rental_price_per_week, rental_price_per_month, rental_currency, rental_min_hours, rental_event_type, features, is_draft")
        .eq("id", id)
        .single();

      if (err || !data) {
        setError(t("listingNotFound"));
        setLoading(false);
        return;
      }
      initialDiscountRef.current = data.discount_percent != null ? Number(data.discount_percent) : null;

      // Use car's stored contact first, then profile as fallback
      const contactPhone = data.owner_phone ?? p?.phone ?? "";
      const contactWa = data.owner_whatsapp ?? p?.whatsapp ?? contactPhone;
      const savedMake = data.make ?? "";
      const makeInList = savedMake && CAR_MAKES.includes(savedMake as (typeof CAR_MAKES)[number]);
      setForm({
        title: data.title ?? "",
        description: data.description ?? "",
        price: String(data.price ?? ""),
        make: makeInList ? savedMake : (savedMake ? OTHER_MAKE : ""),
        make_other: makeInList ? "" : savedMake,
        model: data.model ?? "",
        year: data.year != null ? String(data.year) : "",
        mileage: data.mileage != null ? String(data.mileage) : "",
        currency: data.currency ?? "USD",
        condition: data.condition ?? "used",
        discount_percent: data.discount_percent != null ? String(data.discount_percent) : "",
        province: data.province ?? "",
        city: data.city ?? "",
        country: data.country ?? "",
        type: data.type ?? "",
        transmission: data.transmission ?? "",
        fuel_type: data.fuel_type ?? "",
        images: Array.isArray(data.images) ? data.images.slice(0, 4) : [],
        owner_address: data.owner_address ?? "",
        owner_phone: contactPhone ?? "",
        owner_whatsapp: contactWa ?? "",
        listing_type: (data.listing_type as "sale" | "rent" | "both") ?? "sale",
        rental_price_per_hour: data.rental_price_per_hour != null ? String(data.rental_price_per_hour) : "",
        rental_price_per_day: data.rental_price_per_day != null ? String(data.rental_price_per_day) : "",
        rental_price_per_week: data.rental_price_per_week != null ? String(data.rental_price_per_week) : "",
        rental_price_per_month: data.rental_price_per_month != null ? String(data.rental_price_per_month) : "",
        rental_currency: data.rental_currency ?? "USD",
        rental_min_hours: data.rental_min_hours != null ? String(data.rental_min_hours) : "",
        rental_event_type: Array.isArray(data.rental_event_type) ? data.rental_event_type : [],
        features: Array.isArray(data.features) ? data.features : [],
      });
      setIsDraft(data.is_draft === true);
      setLoading(false);
    }
    load();
  }, [id, router]);

  function getSellerContact() {
    // Use form (from car or user-entered)
    const ph = form.owner_phone.replace(/\D/g, "");
    const wa = (form.owner_whatsapp || ph).replace(/\D/g, "");
    return { phone: ph.length >= 9 ? ph : null, whatsapp: wa.length >= 9 ? wa : null };
  }

  function buildPayload() {
    return buildListingPayload(form, getSellerContact());
  }

  async function handleSaveDraft(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();
    setError("");
    setSaving(true);
    if (
      (form.listing_type === "rent" || form.listing_type === "both") &&
      !hasAtLeastOneRentalPrice(form)
    ) {
      setError(t("rentalPriceAtLeastOne"));
      setSaving(false);
      return;
    }
    if (!getSellerContact().phone) {
      setError(t("setContactToList"));
      setSaving(false);
      return;
    }
    const quality = validateListing(form, "draft");
    if (!quality.ok) {
      setError(t(quality.errorKey as Parameters<typeof t>[0]));
      setSaving(false);
      return;
    }
    const { error: err } = await supabase
      .from("cars")
      .update({ ...buildPayload(), is_draft: true })
      .eq("id", id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setIsDraft(true);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    if (
      (form.listing_type === "rent" || form.listing_type === "both") &&
      !hasAtLeastOneRentalPrice(form)
    ) {
      setError(t("rentalPriceAtLeastOne"));
      setSaving(false);
      return;
    }
    if ((form.listing_type === "sale" || form.listing_type === "both") && !form.price.trim()) {
      setError(t("salePriceRequired"));
      setSaving(false);
      return;
    }
    if (!getSellerContact().phone) {
      setError(t("setContactToList"));
      setSaving(false);
      return;
    }
    const quality = validateListing(form, "publish");
    if (!quality.ok) {
      setError(t(quality.errorKey as Parameters<typeof t>[0]));
      setSaving(false);
      return;
    }
    const payload = buildPayload();
    const { error: err } = await supabase
      .from("cars")
      .update({ ...payload, is_draft: false })
      .eq("id", id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    const newDiscount = payload.discount_percent != null ? payload.discount_percent : 0;
    const prevDiscount = initialDiscountRef.current ?? 0;
    if (newDiscount > 0 && newDiscount > prevDiscount) {
      fetch("/api/notify-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          carId: id,
          carTitle: payload.title,
          discountPercent: newDiscount,
        }),
      }).catch(() => {});
    }
    if (isDraft) {
      setSubmittedSuccess(true);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-caption font-medium text-[var(--foreground)] hover:underline">
          {t("backToDashboard")}
        </Link>
      </div>
    );
  }

  const inputClass = "input-premium";

  if (submittedSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-[var(--radius-lg)] border border-[var(--accent)]/40 bg-[var(--accent-muted)] p-6">
          <h1 className="text-heading mb-3 text-[var(--foreground)]">{t("submittedForApproval")}</h1>
          <p className="text-body mb-6 text-[var(--muted-foreground)]">{t("submittedForApprovalDesc")}</p>
          <Link href="/dashboard/seller" className="btn-primary inline-flex min-h-[44px] items-center">
            {t("backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 sm:px-6 sm:py-10 sm:pb-28 lg:px-8">
      <Link href="/dashboard" className="text-caption mb-6 inline-block font-medium text-[var(--foreground)] hover:underline">
        {t("backToDashboard")}
      </Link>
      <h1 className="text-heading mb-6 text-[var(--foreground)]">{t("editCar")}</h1>

      <form id="edit-car-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("listingType")} *</label>
          <div className="flex flex-wrap gap-3">
            {LISTING_TYPES.map((lt) => (
              <label key={lt.value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="listing_type"
                  value={lt.value}
                  checked={form.listing_type === lt.value}
                  onChange={() => setForm((p) => ({ ...p, listing_type: lt.value as "sale" | "rent" | "both" }))}
                  className="rounded"
                />
                <span className="text-caption">{t(lt.value === "sale" ? "forSale" : lt.value === "rent" ? "forRent" : "saleAndRent")}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("listingPhotosFirst")}</label>
          <ImageUpload
            value={form.images}
            onChange={(urls) => setForm((p) => ({ ...p, images: urls.slice(0, 4) }))}
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("title")} *</label>
          <input type="text" required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} />
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("description")}</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={`${inputClass} min-h-[88px] resize-y`} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("currency")}</label>
            <select value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("condition")}</label>
            <select value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))} className={inputClass}>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{t(c.value as "new" | "used")}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("discountPercent")}</label>
            <input type="number" min={0} max={100} value={form.discount_percent} onChange={(e) => setForm((p) => ({ ...p, discount_percent: e.target.value }))} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(form.listing_type === "sale" || form.listing_type === "both") && (
            <div>
              <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("salePrice")} *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className={inputClass}
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("year")}</label>
            <input type="number" min={1900} max={2030} value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} className={inputClass} />
          </div>
        </div>

        {(form.listing_type === "rent" || form.listing_type === "both") && (
          <div className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] p-4">
            <h3 className="text-caption font-semibold text-[var(--foreground)]">{t("rentalPricing")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("rentPerHour")}</label>
                <input type="number" min={0} step={0.01} value={form.rental_price_per_hour} onChange={(e) => setForm((p) => ({ ...p, rental_price_per_hour: e.target.value }))} placeholder="e.g. 25" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("rentPerDay")}</label>
                <input type="number" min={0} step={0.01} value={form.rental_price_per_day} onChange={(e) => setForm((p) => ({ ...p, rental_price_per_day: e.target.value }))} placeholder="e.g. 150" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("rentPerWeek")}</label>
                <input type="number" min={0} step={0.01} value={form.rental_price_per_week} onChange={(e) => setForm((p) => ({ ...p, rental_price_per_week: e.target.value }))} placeholder="e.g. 800" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("rentPerMonth")}</label>
                <input type="number" min={0} step={0.01} value={form.rental_price_per_month} onChange={(e) => setForm((p) => ({ ...p, rental_price_per_month: e.target.value }))} placeholder="e.g. 2500" className={inputClass} />
              </div>
            </div>
            {form.rental_price_per_day && (
              <button
                type="button"
                onClick={() => {
                  const day = parseFloat(form.rental_price_per_day);
                  if (!isNaN(day) && day > 0) {
                    setForm((p) => ({
                      ...p,
                      rental_price_per_week: p.rental_price_per_week || String(Math.round(day * 5)),
                      rental_price_per_month: p.rental_price_per_month || String(Math.round(day * 20)),
                    }));
                  }
                }}
                className="text-caption font-medium text-[var(--accent)] hover:underline"
              >
                {t("suggestFromDaily")} →
              </button>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("rentalMinHours")}</label>
                <input type="number" min={1} value={form.rental_min_hours} onChange={(e) => setForm((p) => ({ ...p, rental_min_hours: e.target.value }))} placeholder="e.g. 2" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("currency")}</label>
                <select value={form.rental_currency} onChange={(e) => setForm((p) => ({ ...p, rental_currency: e.target.value }))} className={inputClass}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("rentalEventTypes")}</label>
              <div className="flex flex-wrap gap-2">
                {RENTAL_EVENT_TYPES.map((ev) => (
                  <label key={ev.value} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-caption">
                    <input
                      type="checkbox"
                      checked={form.rental_event_type.includes(ev.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm((p) => ({ ...p, rental_event_type: [...p.rental_event_type, ev.value] }));
                        } else {
                          setForm((p) => ({ ...p, rental_event_type: p.rental_event_type.filter((x) => x !== ev.value) }));
                        }
                      }}
                      className="rounded"
                    />
                    {t(ev.value === "wedding" ? "eventWedding" : ev.value === "tourism" ? "eventTourism" : ev.value === "corporate" ? "eventCorporate" : ev.value === "airport" ? "eventAirport" : "eventPrivate")}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("make")} *</label>
            <select
              value={form.make === OTHER_MAKE ? OTHER_MAKE : CAR_MAKES.includes(form.make as (typeof CAR_MAKES)[number]) ? form.make : ""}
              onChange={(e) => setForm((p) => ({ ...p, make: e.target.value, make_other: e.target.value === OTHER_MAKE ? p.make_other : "" }))}
              className={inputClass}
              required
            >
              <option value="">{t("selectMake")}</option>
              {CAR_MAKES.filter((m) => m !== OTHER_MAKE).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              <option value={OTHER_MAKE}>{t("other")}</option>
            </select>
            {form.make === OTHER_MAKE && (
              <input
                type="text"
                required
                value={form.make_other}
                onChange={(e) => setForm((p) => ({ ...p, make_other: e.target.value }))}
                placeholder="Enter make"
                className={`${inputClass} mt-2`}
              />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("model")} *</label>
            <input type="text" required value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("mileage")}</label>
            <input type="number" min={0} value={form.mileage} onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("vehicleType")}</label>
            <select required value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={inputClass}>
              <option value="">{t("selectOption")}</option>
              {CAR_TYPES.map((ty) => (
                <option key={ty} value={ty}>{ty}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("shopByTransmission")}</label>
            <select value={form.transmission} onChange={(e) => setForm((p) => ({ ...p, transmission: e.target.value }))} className={inputClass}>
              <option value="">—</option>
              {TRANSMISSIONS.map((tr) => (
                <option key={tr.value} value={tr.value}>{t(tr.value)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("shopByFuel")}</label>
            <select value={form.fuel_type} onChange={(e) => setForm((p) => ({ ...p, fuel_type: e.target.value }))} className={inputClass}>
              <option value="">—</option>
              {FUEL_TYPES.map((f) => (
                <option key={f.value} value={f.value}>{t(f.value)}</option>
              ))}
            </select>
          </div>
        </div>

        <ListingFeaturePicker
          value={form.features}
          onChange={(features) => setForm((p) => ({ ...p, features }))}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("townCity")}</label>
            <select
              value={form.province}
              onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
              className={inputClass}
            >
              <option value="">{t("selectTownCity")}</option>
              {DRC_LOCATIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium">{t("country")}</label>
            <input
              type="text"
              value={form.country}
              readOnly
              className={`${inputClass} bg-[var(--card)] opacity-80`}
            />
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <p className="mb-2 text-caption font-medium text-[var(--foreground)]">{t("contactUsedForAllListings")}</p>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            {t("contactStoredOnListing")} <Link href="/dashboard/settings" className="underline">{t("contactSettings")}</Link>
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="mb-1 block text-[10px] font-medium">{t("phone")} *</label>
              <input
                type="text"
                value={form.owner_phone}
                onChange={(e) => setForm((p) => ({ ...p, owner_phone: e.target.value }))}
                placeholder="+243812345678"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium">{t("whatsapp")}</label>
              <input
                type="text"
                value={form.owner_whatsapp}
                onChange={(e) => setForm((p) => ({ ...p, owner_whatsapp: e.target.value }))}
                placeholder="+243812345678"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("addressOptional")}</label>
            <input type="text" value={form.owner_address} onChange={(e) => setForm((p) => ({ ...p, owner_address: e.target.value }))} className={inputClass} placeholder="e.g. Kinshasa, Gombe" />
          </div>
        </div>

        {error && <p className="text-caption text-red-600">{error}</p>}
        <div className="h-4" aria-hidden />
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl gap-2 sm:gap-3">
          {isDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="btn-secondary min-h-[44px] flex-1 disabled:opacity-50"
            >
              {saving ? t("saving") : t("saveDraft")}
            </button>
          )}
          <button
            type="submit"
            form="edit-car-form"
            disabled={saving}
            className="btn-primary min-h-[44px] flex-[1.4] disabled:opacity-50"
          >
            {saving ? t("saving") : isDraft ? t("submitForApproval") : t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
