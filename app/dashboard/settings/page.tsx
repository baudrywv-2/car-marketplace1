"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { isValidDRCPhone } from "@/lib/phone-validation";
import { syncSellerProfileFromAuth } from "@/lib/seller-profile";
import { DRC_LOCATIONS } from "@/lib/constants";

const AVATAR_MAX_MB = 3;

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  whatsapp: string | null;
  company_name?: string | null;
  city?: string | null;
  age?: number | null;
  avatar_url?: string | null;
  bio?: string | null;
};

type AccountType = "individual" | "company";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successKey, setSuccessKey] = useState<"contactSaved" | "avatarSaved">("contactSaved");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login?next=/dashboard/settings");
        return;
      }

      const p = await syncSellerProfileFromAuth(supabase, u);
      setProfile(p);
      setFullName(p.full_name ?? "");
      setPhone(p.phone ?? "");
      setWhatsapp(p.whatsapp ?? "");
      setCompanyName(p.company_name ?? "");
      setAccountType(p.company_name?.trim() ? "company" : "individual");
      setCity(p.city ?? "");
      setAge(p.age != null ? String(p.age) : "");
      setBio(p.bio ?? "");
      setAvatarUrl(p.avatar_url ?? null);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const name = fullName.trim();
    if (!name) {
      setError(t("signupNameRequired"));
      return;
    }

    const isSeller = profile?.role === "seller" || profile?.role === "admin";
    if (isSeller && accountType === "company" && !companyName.trim()) {
      setError(t("companyBrandRequired"));
      return;
    }
    if (!phone.trim()) {
      setError(t("signupPhoneInvalid"));
      return;
    }
    if (!isValidDRCPhone(phone)) {
      setError(t("signupPhoneInvalid"));
      return;
    }

    const ph = phone.trim().replace(/\D/g, "");
    const wa = (whatsapp.trim() || ph).replace(/\D/g, "");
    const ageNumber = age.trim() ? Number.parseInt(age.trim(), 10) : null;
    const safeAge = Number.isFinite(ageNumber as number) && (ageNumber as number) > 0 ? (ageNumber as number) : null;
    const resolvedCompany =
      isSeller && accountType === "company" ? companyName.trim() || null : companyName.trim() || null;

    setSaving(true);
    const { error: err } = await supabase.from("profiles").upsert(
      {
        id: profile!.id,
        full_name: name,
        phone: ph,
        whatsapp: wa,
        company_name: resolvedCompany,
        city: city.trim() || null,
        age: safeAge,
        avatar_url: avatarUrl,
        bio: bio.trim() || null,
      },
      { onConflict: "id" }
    );
    setSaving(false);
    if (err) {
      setError(t("actionFailedRetry"));
      return;
    }
    setSuccess(true);
    setSuccessKey("contactSaved");
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            full_name: name,
            phone: ph,
            whatsapp: wa,
            company_name: resolvedCompany,
            city: city.trim() || null,
            age: safeAge,
            avatar_url: avatarUrl,
            bio: bio.trim() || null,
          }
        : null
    );
  }

  async function persistAvatarUrl(nextUrl: string | null) {
    if (!profile) return;
    const { error: err } = await supabase
      .from("profiles")
      .update({ avatar_url: nextUrl })
      .eq("id", profile.id);
    if (err) throw new Error(err.message);
    setAvatarUrl(nextUrl);
    setProfile((prev) => (prev ? { ...prev, avatar_url: nextUrl } : prev));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;

    setError("");
    setSuccess(false);

    if (!file.type.startsWith("image/")) {
      setError(t("avatarUploadFailed"));
      return;
    }
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      setError(t("imageTooLarge").replace("{n}", String(AVATAR_MAX_MB)));
      return;
    }

    try {
      setAvatarUploading(true);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      // Use existing car-images bucket + user folder RLS (avatars bucket does not exist)
      const path = `users/${profile.id}/avatar/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("car-images").upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
      if (uploadError) {
        setError(t("avatarUploadFailed"));
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("car-images").getPublicUrl(path);
      await persistAvatarUrl(publicUrl);
      setSuccessKey("avatarSaved");
      setSuccess(true);
    } catch {
      setError(t("avatarUploadFailed"));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!profile || !avatarUrl) return;
    setError("");
    setSuccess(false);
    try {
      setAvatarUploading(true);
      await persistAvatarUrl(null);
      setSuccessKey("avatarSaved");
      setSuccess(true);
    } catch {
      setError(t("actionFailedRetry"));
    } finally {
      setAvatarUploading(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  const isSeller = profile.role === "seller" || profile.role === "admin";

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href={isSeller ? "/dashboard/seller" : "/dashboard"} className="mb-6 inline-block text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        {t("backToDashboard")}
      </Link>
      <h1 className="text-heading text-[var(--foreground)]">{t("contactSettings")}</h1>
      <p className="mt-2 text-body text-[var(--muted-foreground)]">{t("contactSettingsDesc")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="mb-3 text-caption font-medium text-[var(--foreground)]">{t("profilePhoto")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--border)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={fullName || t("profilePhoto")} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[var(--muted-foreground)]">
                  {fullName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10px] text-white">
                  {t("uploading")}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="sr-only"
                disabled={avatarUploading}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                  className="btn-secondary min-h-10 px-3 text-[11px] disabled:opacity-50"
                >
                  {avatarUrl ? t("changePhoto") : t("choosePhoto")}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={handleRemoveAvatar}
                    className="min-h-10 rounded-[var(--radius)] border border-[var(--border)] px-3 text-[11px] text-[var(--muted-foreground)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:opacity-50"
                  >
                    {t("removePhoto")}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                JPG, PNG, WebP · {t("imageTooLarge").replace("{n}", String(AVATAR_MAX_MB))}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">
            {t("fullName")} *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-premium w-full"
            required
          />
        </div>

        {isSeller && (
          <fieldset>
            <legend className="mb-2 text-caption font-medium text-[var(--foreground)]">{t("accountType")}</legend>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`cursor-pointer rounded-lg border px-3 py-3 text-center text-xs transition ${
                  accountType === "individual"
                    ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  className="sr-only"
                  checked={accountType === "individual"}
                  onChange={() => setAccountType("individual")}
                />
                {t("sellerIndividual")}
              </label>
              <label
                className={`cursor-pointer rounded-lg border px-3 py-3 text-center text-xs transition ${
                  accountType === "company"
                    ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  className="sr-only"
                  checked={accountType === "company"}
                  onChange={() => setAccountType("company")}
                />
                {t("sellerCompany")}
              </label>
            </div>
            <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
              {accountType === "company" ? t("companyNameHint") : t("individualNameHint")}
            </p>
          </fieldset>
        )}

        {isSeller && (
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">
              {accountType === "company" ? `${t("companyBrandName")} *` : t("tradingAsOptional")}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={accountType === "company" ? t("companyBrandPlaceholder") : t("tradingAsPlaceholder")}
              className="input-premium w-full"
              required={accountType === "company"}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("city")}</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input-premium w-full"
            >
              <option value="">{t("selectTownCity")}</option>
              {DRC_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              {city && !(DRC_LOCATIONS as readonly string[]).includes(city) && (
                <option value={city}>{city}</option>
              )}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("age")}</label>
            <input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} className="input-premium w-full" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("bio")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            className="input-premium w-full"
            placeholder={t("bioPlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">
            {t("phone")} *
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243812345678"
            className="input-premium w-full"
            required
          />
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{t("phoneOnFile")}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">{t("whatsapp")}</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+243812345678"
            className="input-premium w-full"
          />
        </div>

        {error && <p className="text-caption text-red-500">{error}</p>}
        {success && <p className="text-caption text-emerald-400">{t(successKey)}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary min-h-[44px] disabled:opacity-50">
            {saving ? t("saving") : t("saveChanges")}
          </button>
          <Link href={isSeller ? "/dashboard/seller" : "/dashboard"} className="btn-secondary min-h-[44px] shrink-0 text-center">
            {t("cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
