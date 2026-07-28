"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import LoadingFallback from "@/app/components/LoadingFallback";

import AuthShell from "@/app/components/AuthShell";

function ConfirmEmailForm() {
  const router = useRouter();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") || "").trim();
  const role = searchParams.get("role") === "seller" ? "seller" : "buyer";

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function redirectIfSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      if (role === "seller") {
        router.replace("/dashboard/seller/welcome");
      } else {
        router.replace("/dashboard/buyer");
      }
      router.refresh();
    }

    redirectIfSession();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      if (role === "seller") {
        router.replace("/dashboard/seller/welcome");
      } else {
        router.replace("/dashboard/buyer");
      }
      router.refresh();
    });

    // Light polling as backup (auth listener is primary); backoff via longer interval
    const interval = window.setInterval(redirectIfSession, 12000);
    const onFocus = () => { void redirectIfSession(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void redirectIfSession();
    });
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      sub.subscription.unsubscribe();
    };
  }, [router, role]);

  async function handleResend() {
    if (!email) {
      setError(t("signupEmailRequired"));
      return;
    }
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    const { error: err } = await supabase.auth.resend({ type: "signup", email });
    setResendLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResendSuccess(true);
  }

  const subtitle = t("confirmEmailSubtitle").replace("{email}", email || "—");

  return (
    <AuthShell
      title={t("confirmEmailTitle")}
      subtitle={subtitle}
      footer={
        <p className="mt-6 text-center text-caption text-[var(--muted-foreground)]">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            {t("logIn")}
          </Link>
        </p>
      }
    >
      <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)]">
        {t("confirmEmailWaiting")}
      </p>
      <p className="mt-3 text-caption text-[var(--muted-foreground)]">{t("confirmEmailHint")}</p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </p>
      )}
      {resendSuccess && (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
          {t("verificationSent")}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || !email}
          className="btn-secondary w-full min-h-[44px] text-sm disabled:opacity-50"
        >
          {resendLoading ? t("sending") : t("resendVerification")}
        </button>
        <Link
          href={`/login?next=${encodeURIComponent(role === "seller" ? "/dashboard/seller/welcome" : "/dashboard/buyer")}`}
          className="btn-accent w-full min-h-[44px] text-center text-sm leading-[44px]"
        >
          {t("confirmEmailGoLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback variant="centered" />}>
      <ConfirmEmailForm />
    </Suspense>
  );
}
