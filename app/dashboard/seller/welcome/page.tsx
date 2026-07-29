"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { syncSellerProfileFromAuth } from "@/lib/seller-profile";

const SEEN_KEY = "seller-onboarding-seen";

export default function SellerWelcomePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/dashboard/seller/welcome");
        return;
      }
      const profile = await syncSellerProfileFromAuth(supabase, user);
      if (profile.role !== "seller" && profile.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setEmailVerified(!!user.email_confirmed_at);
      setDisplayName(profile.company_name?.trim() || profile.full_name?.trim() || "");
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, [router]);

  function goDashboard() {
    router.push("/dashboard/seller");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  const steps = [
    { title: t("sellerOnboardStep1Title"), desc: t("sellerOnboardStep1Desc") },
    { title: t("sellerOnboardStep2Title"), desc: t("sellerOnboardStep2Desc") },
    { title: t("sellerOnboardStep3Title"), desc: t("sellerOnboardStep3Desc") },
    { title: t("sellerOnboardStep4Title"), desc: t("sellerOnboardStep4Desc") },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--accent-muted)] via-transparent to-transparent px-5 py-6 sm:px-8 sm:py-8">
          <Link
            href="/"
            className="inline-flex text-[11px] font-mono text-[var(--accent)] transition-opacity hover:opacity-90"
            aria-label={t("backToHome")}
          >
            <span className="opacity-60">&gt;</span> {t("siteName")}
          </Link>
          <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {t("sellerOnboardingTitle")}
            {displayName ? ` — ${displayName}` : ""}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t("sellerOnboardingSubtitle")}
          </p>
          {!emailVerified && (
            <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              {t("setupEmail")} — {t("sellerOnboardStep2Desc")}
            </p>
          )}
        </div>

        <ol className="space-y-0 divide-y divide-[var(--border)] px-5 sm:px-8">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 py-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/50 bg-[var(--accent-muted)] font-mono text-xs font-bold text-[var(--accent)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">{step.title.replace(/^\d+\.\s*/, "")}</h2>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="border-t border-[var(--border)] px-5 py-4 sm:px-8">
          <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">{t("sellerOnboardTip")}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--background)]/50 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:p-6">
          <Link href="/dashboard/cars/new" className="btn-primary px-4 py-2.5 text-center text-sm">
            {t("sellerOnboardAddCar")}
          </Link>
          <Link href="/dashboard/settings" className="btn-secondary px-4 py-2.5 text-center text-sm">
            {t("sellerOnboardEditProfile")}
          </Link>
          <a
            href="/DRCCARS-Guide-Vendeur.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary px-4 py-2.5 text-center text-sm"
          >
            {t("downloadSellerGuide")}
          </a>
          <button type="button" onClick={goDashboard} className="btn-accent px-4 py-2.5 text-sm">
            {t("sellerOnboardGoDashboard")}
          </button>
          <button
            type="button"
            onClick={goDashboard}
            className="text-center text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:ml-auto"
          >
            {t("sellerOnboardSkip")}
          </button>
        </div>
      </div>
    </div>
  );
}
