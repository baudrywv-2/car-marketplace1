"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { isValidDRCPhone } from "@/lib/phone-validation";
import { syncSellerProfileFromAuth } from "@/lib/seller-profile";
import { DRC_LOCATIONS } from "@/lib/constants";

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
        role: profile!.role,
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
      setError(err.message);
      return;
    }
    setSuccess(true);
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      setAvatarUploading(true);
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/${Date.now()}.${ext ?? "png"}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
      });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      setSuccess(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("avatarUploadFailed"));
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
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--border)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={fullName || "Avatar"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] text-[var(--muted-foreground)]">
                {fullName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-caption font-medium text-[var(--foreground)]">{t("profilePhoto")}</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-[11px] text-[var(--muted-foreground)]" />
            {avatarUploading && <p className="text-[10px] text-[var(--muted-foreground)]">{t("uploading")}</p>}
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
              placeholder={accountType === "company" ? "e.g. Auto Kinshasa" : "e.g. Jean Motors"}
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
            placeholder="e.g. Dealer based in Goma, 10+ years importing vehicles."
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
        {success && <p className="text-caption text-emerald-400">{t("contactSaved")}</p>}

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
