"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";

type Profile = { id: string; full_name: string | null; role: string; phone: string | null; whatsapp: string | null; company_name?: string | null };

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login?next=/dashboard/settings");
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone, whatsapp, company_name")
        .eq("id", u.id)
        .single();
      const fallback = { id: u.id, full_name: u.email ?? null, role: "seller", phone: null, whatsapp: null, company_name: null };
      setProfile(p ?? fallback);
      setPhone(p?.phone ?? "");
      setWhatsapp(p?.whatsapp ?? "");
      setCompanyName(p?.company_name ?? "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const ph = phone.replace(/\D/g, "");
    if (ph.length < 9) {
      setError(t("signupPhoneInvalid") || "Please enter a valid phone number (9–15 digits).");
      return;
    }
    const wa = (whatsapp.trim() || ph).replace(/\D/g, "");
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .upsert(
        { id: profile!.id, full_name: profile!.full_name, role: profile!.role, phone: ph, whatsapp: wa, company_name: companyName.trim() || null },
        { onConflict: "id" }
      );
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    setProfile((prev) => prev ? { ...prev, phone: ph, whatsapp: wa, company_name: companyName.trim() || null } : null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-body text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/dashboard" className="mb-6 inline-block text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        {t("backToDashboard")}
      </Link>
      <h1 className="text-heading text-[var(--foreground)]">{t("contactSettings")}</h1>
      <p className="mt-2 text-body text-[var(--muted-foreground)]">{t("contactSettingsDesc")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {(profile?.role === "seller" || profile?.role === "admin") && (
          <div>
            <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">
              Company / Brand name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Auto Kinshasa"
              className="input-premium w-full"
            />
            <p className="mt-1 text-caption text-[var(--muted-foreground)]">
              Your brand or company name (sellers only). Shown to admin for rendez-vous.
            </p>
          </div>
        )}
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
        </div>
        <div>
          <label className="mb-1.5 block text-caption font-medium text-[var(--foreground)]">
            {t("whatsapp")}
          </label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+243812345678 (same as phone if empty)"
            className="input-premium w-full"
          />
          <p className="mt-1 text-caption text-[var(--muted-foreground)]">
            Leave empty to use your phone number for WhatsApp too.
          </p>
        </div>
        {error && <p className="text-caption text-red-600">{error}</p>}
        {success && <p className="text-caption text-green-600">{t("contactSaved")}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary min-h-[44px] disabled:opacity-50">
            {saving ? t("saving") : t("saveChanges")}
          </button>
          <Link href="/dashboard" className="btn-secondary min-h-[44px] shrink-0 text-center">
            {t("cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
