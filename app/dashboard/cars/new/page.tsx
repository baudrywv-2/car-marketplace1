"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DRC_LOCATIONS, CAR_TYPES, CAR_MAKES, OTHER_MAKE, LISTING_TYPES, RENTAL_EVENT_TYPES, CAR_FEATURES } from "@/lib/constants";
import { CURRENCIES, CONDITIONS, TRANSMISSIONS, FUEL_TYPES } from "@/lib/constants";
import { useLocale } from "@/app/contexts/LocaleContext";
import ImageUpload from "@/app/components/ImageUpload";

function isVerified(user: { email_confirmed_at?: string | null } | null): boolean {
  return !!user?.email_confirmed_at;
}

export default function NewCarPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string; email_confirmed_at?: string | null } | null>(null);
  const [profile, setProfile] = useState<{ phone: string | null; whatsapp: string | null } | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
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
    country: "Democratic Republic of Congo",
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
  const [listingContact, setListingContact] = useState<{ phone: string; whatsapp: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login?next=/dashboard/cars/new");
        return;
      }
      setUser(u);
      const { data: p } = await supabase.from("profiles").select("phone, whatsapp").eq("id", u.id).single();
      setProfile(p ?? null);
      // Fallback: fetch phone from seller's existing listing if profile has none
      const ph = p?.phone?.replace(/\D/g, "");
      const wa = p?.whatsapp?.replace(/\D/g, "") || ph;
      if (ph && ph.length >= 9) {
        setListingContact({ phone: ph, whatsapp: wa && wa.length >= 9 ? wa : ph });
      } else {
        const { data: latestCar } = await supabase
          .from("cars")
          .select("owner_phone, owner_whatsapp")
          .eq("owner_id", u.id)
          .not("owner_phone", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (latestCar?.owner_phone) {
          const lph = latestCar.owner_phone.replace(/\D/g, "");
          const lwa = (latestCar.owner_whatsapp || lph).replace(/\D/g, "");
          if (lph.length >= 9) {
            setListingContact({ phone: lph, whatsapp: lwa.length >= 9 ? lwa : lph });
          }
        }
      }
      setLoading(false);
    })();
  }, [router]);

  async function handleResendVerification() {
    if (!user?.email) return;
    setResendLoading(true);
    setResendSuccess(false);
    const { error: err } = await supabase.auth.resend({ type: "signup", email: user.email });
    setResendLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResendSuccess(true);
    setError("");
  }

  function getSellerContact() {
    // Prefer form (user may have edited), then profile/listing fallback
    const ph = form.owner_phone.replace(/\D/g, "");
    if (ph.length >= 9) {
      const wa = (form.owner_whatsapp || ph).replace(/\D/g, "");
      return { phone: ph, whatsapp: wa.length >= 9 ? wa : ph };
    }
    if (listingContact?.phone && listingContact.phone.length >= 9) {
      return { phone: listingContact.phone, whatsapp: listingContact.whatsapp?.length >= 9 ? listingContact.whatsapp : listingContact.phone };
    }
    return { phone: null, whatsapp: null };
  }

  function buildPayload() {
    const { phone, whatsapp } = getSellerContact();
    const isRent = form.listing_type === "rent" || form.listing_type === "both";
    return {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: form.listing_type === "rent" ? 0 : (parseFloat(form.price) || 0),
      make: form.make === OTHER_MAKE ? form.make_other.trim() : form.make.trim(),
      model: form.model.trim(),
      year: form.year ? parseInt(form.year, 10) : null,
      mileage: form.mileage ? parseInt(form.mileage, 10) : null,
      province: form.province.trim() || null,
      city: null,
      country: form.country.trim() || null,
      type: form.type.trim() || null,
      transmission: form.transmission.trim() || null,
      fuel_type: form.fuel_type.trim() || null,
      currency: form.currency || "USD",
      condition: form.condition || "used",
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      images: form.images.slice(0, 4),
      owner_phone: phone,
      owner_whatsapp: whatsapp,
      owner_address: form.owner_address.trim() || null,
      listing_type: form.listing_type,
      rental_price_per_hour: isRent && form.rental_price_per_hour ? parseFloat(form.rental_price_per_hour) : null,
      rental_price_per_day: isRent && form.rental_price_per_day ? parseFloat(form.rental_price_per_day) : null,
      rental_price_per_week: isRent && form.rental_price_per_week ? parseFloat(form.rental_price_per_week) : null,
      rental_price_per_month: isRent && form.rental_price_per_month ? parseFloat(form.rental_price_per_month) : null,
      rental_currency: isRent ? (form.rental_currency || "USD") : null,
      rental_min_hours: isRent && form.rental_min_hours ? parseInt(form.rental_min_hours, 10) : null,
      rental_event_type: isRent && form.rental_event_type.length > 0 ? form.rental_event_type : null,
      features: form.features.length > 0 ? form.features : null,
    };
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u || !isVerified(u)) {
      setError("You must verify your email to list a car.");
      setSubmitting(false);
      return;
    }
    const { phone } = getSellerContact();
    if (!phone) {
      setError(t("setContactToList"));
      setSubmitting(false);
      return;
    }

    if (!form.title.trim()) {
      setError("Title is required to save a draft.");
      setSubmitting(false);
      return;
    }
    if ((form.listing_type === "rent" || form.listing_type === "both") && !form.rental_price_per_hour && !form.rental_price_per_day && !form.rental_price_per_week && !form.rental_price_per_month) {
      setError(t("rentalPriceAtLeastOne"));
      setSubmitting(false);
      return;
    }

    const payload = buildPayload();
    if ((form.listing_type === "rent" || form.listing_type === "both") && !payload.rental_price_per_hour && !payload.rental_price_per_day && !payload.rental_price_per_week && !payload.rental_price_per_month) {
      setError(t("rentalPriceAtLeastOne"));
      setSubmitting(false);
      return;
    }
    const { error: err } = await supabase.from("cars").insert({
      owner_id: u.id,
      ...payload,
      is_draft: true,
      is_approved: false,
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u || !isVerified(u)) {
      setError("You must verify your email to list a car.");
      setSubmitting(false);
      return;
    }
    const { phone } = getSellerContact();
    if (!phone) {
      setError(t("setContactToList"));
      setSubmitting(false);
      return;
    }

    const payload = buildPayload();
    if ((form.listing_type === "rent" || form.listing_type === "both") && !payload.rental_price_per_hour && !payload.rental_price_per_day && !payload.rental_price_per_week && !payload.rental_price_per_month) {
      setError(t("rentalPriceAtLeastOne"));
      setSubmitting(false);
      return;
    }
    if ((form.listing_type === "sale" || form.listing_type === "both") && !form.price.trim()) {
      setError("Sale price is required.");
      setSubmitting(false);
      return;
    }
    const { error: err } = await supabase.from("cars").insert({
      owner_id: u.id,
      ...payload,
      is_draft: false,
      is_approved: false,
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const inputClass = "input-premium";

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-body text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  if (!isVerified(user)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/dashboard" className="text-caption mb-6 inline-block font-medium text-[var(--foreground)] hover:underline">
          {t("backToDashboard")}
        </Link>
        <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <h1 className="text-heading mb-3 text-[var(--foreground)]">{t("verifyEmailToList")}</h1>
          <p className="text-body mb-6 text-[var(--muted-foreground)]">{t("verifyEmailDesc")}</p>
          {error && <p className="mb-4 text-caption text-red-600">{error}</p>}
          {resendSuccess && <p className="mb-4 text-caption text-green-600">{t("verificationSent")}</p>}
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading}
            className="btn-accent disabled:opacity-50"
          >
            {resendLoading ? "…" : t("resendVerification")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Link href="/dashboard" className="text-caption mb-6 inline-block font-medium text-[var(--foreground)] hover:underline">
        {t("backToDashboard")}
      </Link>
      <h1 className="text-heading mb-6 text-[var(--foreground)]">{t("addCar")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. 2020 Toyota Camry"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputClass} min-h-[88px] resize-y`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Currency *</label>
            <select value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Condition *</label>
            <select value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))} className={inputClass}>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.labelEn}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Discount % (optional)</label>
            <input type="number" min={0} max={100} step={1} value={form.discount_percent} onChange={(e) => setForm((p) => ({ ...p, discount_percent: e.target.value }))} placeholder="e.g. 20" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(form.listing_type === "sale" || form.listing_type === "both") && (
            <div>
              <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Sale price *</label>
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
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Year</label>
            <input type="number" min={1900} max={2030} value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} className={inputClass} />
          </div>
        </div>

        {(form.listing_type === "rent" || form.listing_type === "both") && (
          <div className="space-y-4 rounded-[var(--radius)] border border-[var(--border)] p-4">
            <h3 className="text-caption font-semibold text-[var(--foreground)]">{t("rentalPricing")}</h3>
            <p className="text-caption text-[var(--muted-foreground)]">Set one or more tiers. Weekly and monthly rates often offer better value for longer rentals.</p>
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
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Rental currency</label>
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
              <p className="mt-1 text-caption text-[var(--muted-foreground)]">Select all that apply (weddings, tourism, corporate events, etc.)</p>
            </div>
          </div>
        )}


        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Make *</label>
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
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Model *</label>
            <input type="text" required value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="e.g. Camry" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Mileage</label>
            <input type="number" min={0} value={form.mileage} onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Type</label>
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              {CAR_TYPES.map((ty) => (
                <option key={ty} value={ty}>{ty}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Transmission</label>
            <select value={form.transmission} onChange={(e) => setForm((p) => ({ ...p, transmission: e.target.value }))} className={inputClass}>
              <option value="">—</option>
              {TRANSMISSIONS.map((tr) => (
                <option key={tr.value} value={tr.value}>{t(tr.value)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Fuel</label>
            <select value={form.fuel_type} onChange={(e) => setForm((p) => ({ ...p, fuel_type: e.target.value }))} className={inputClass}>
              <option value="">—</option>
              {FUEL_TYPES.map((f) => (
                <option key={f.value} value={f.value}>{t(f.value)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-caption font-medium text-[var(--foreground)]">Features</label>
          <p className="mb-3 text-[11px] text-[var(--muted-foreground)]">Select all that apply</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {CAR_FEATURES.map((f) => {
              const selected = form.features.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setForm((p) => ({
                    ...p,
                    features: selected ? p.features.filter((x) => x !== f.id) : [...p.features, f.id],
                  }))}
                  className={`rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {f.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Town / City *</label>
          <select required value={form.province} onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))} className={inputClass}>
            <option value="">{t("selectTownCity")}</option>
            {DRC_LOCATIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Country</label>
          <input type="text" value={form.country} readOnly className={`${inputClass} bg-[var(--card)] opacity-80`} />
          <p className="mt-1 text-caption text-[var(--muted-foreground)]">{t("listForDRCOnly")}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Images</label>
          <ImageUpload value={form.images} onChange={(urls) => setForm((p) => ({ ...p, images: urls.slice(0, 4) }))} disabled={submitting} />
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <p className="mb-2 text-caption font-medium text-[var(--foreground)]">{t("contactUsedForAllListings")}</p>
          <div className="mb-4">
            <p className="mb-2 text-caption text-[var(--muted-foreground)]">{t("contactUsedForAllListings")}</p>
            {(listingContact?.phone ?? profile?.phone) && (
              <p className="mb-2 text-caption text-[var(--muted-foreground)]">Pre-filled from your profile or existing listing. <Link href="/dashboard/settings" className="underline">{t("editContact")}</Link></p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("phone")} *</label>
                <input type="text" value={form.owner_phone || listingContact?.phone || profile?.phone || ""} onChange={(e) => setForm((p) => ({ ...p, owner_phone: e.target.value }))} placeholder="+243812345678" className={inputClass} required />
              </div>
              <div>
                <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("whatsapp")}</label>
                <input type="text" value={form.owner_whatsapp || listingContact?.whatsapp || profile?.whatsapp || listingContact?.phone || profile?.phone || ""} onChange={(e) => setForm((p) => ({ ...p, owner_whatsapp: e.target.value }))} placeholder="+243812345678" className={inputClass} />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">Address (optional)</label>
            <input type="text" value={form.owner_address} onChange={(e) => setForm((p) => ({ ...p, owner_address: e.target.value }))} className={inputClass} placeholder="e.g. Kinshasa, Gombe" />
          </div>
        </div>

        {error && <p className="text-caption text-red-600">{error}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button type="submit" disabled={submitting} className="btn-primary min-h-[44px] shrink-0 disabled:opacity-50">
            {submitting ? t("saving") : t("submitForApproval")}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={submitting}
            className="btn-secondary min-h-[44px] shrink-0 disabled:opacity-50"
          >
            {submitting ? t("saving") : t("saveDraft")}
          </button>
          <Link href="/dashboard" className="btn-secondary min-h-[44px] shrink-0 text-center">
            {t("cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
