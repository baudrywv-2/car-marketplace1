"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import LoadingFallback from "@/app/components/LoadingFallback";
import AuthShell from "@/app/components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const contextSubtitle = useMemo(() => {
    if (next.startsWith("/cars/") && !next.includes("/success")) return t("loginContextMeeting");
    if (next.startsWith("/favorites")) return t("loginContextFavorites");
    if (next.startsWith("/dashboard")) return t("loginContextDashboard");
    return t("loginSubtitle");
  }, [next, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResetMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleResetPassword() {
    setError("");
    setResetMessage("");
    if (!email.trim()) {
      setError(t("enterEmailToReset"));
      return;
    }
    try {
      setResetLoading(true);
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) {
        setError(error.message);
      } else {
        setResetMessage(t("resetEmailSent"));
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("loginWelcome")}
      subtitle={contextSubtitle}
      footer={
        <p className="text-caption mt-6 text-center text-[var(--muted-foreground)]">
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
            {t("signUp")}
          </Link>
        </p>
      }
    >
      <h2 className="mb-4 font-mono text-base font-semibold text-[var(--foreground)] sm:mb-5 sm:text-lg">{t("logIn")}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
        <div>
          <label htmlFor="email" className="text-caption mb-1.5 block">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="input-premium"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-caption mb-1.5 block">
            {t("password")}
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="input-premium"
          />
          <div className="mt-1.5 flex flex-col gap-2 text-[11px] text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 sm:min-h-0">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] sm:h-3.5 sm:w-3.5"
              />
              <span>{t("showPassword")}</span>
            </label>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="min-h-[44px] self-start font-medium text-[var(--accent)] hover:underline disabled:opacity-60 sm:min-h-0 sm:self-auto"
            >
              {resetLoading ? t("sending") : t("forgotPassword")}
            </button>
          </div>
        </div>
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            {error}
          </p>
        )}
        {resetMessage && !error && (
          <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
            {resetMessage}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-accent w-full min-h-[44px] disabled:opacity-50">
          {loading ? t("sending") : t("logIn")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback variant="centered" />}>
      <LoginForm />
    </Suspense>
  );
}
