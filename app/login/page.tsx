"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import LoadingFallback from "@/app/components/LoadingFallback";

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
      setError("Enter your email first to reset your password.");
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
        setResetMessage("Password reset email sent. Check your inbox.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="card-premium w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-heading mb-6 text-[var(--foreground)]">{t("logIn")}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              className="input-premium"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-3 w-3"
                />
                <span>Show password</span>
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-[11px] font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
              >
                {resetLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>
          </div>
          {error && <p className="text-small text-red-600">{error}</p>}
          {resetMessage && !error && (
            <p className="text-small text-emerald-600">{resetMessage}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? t("sending") : t("logIn")}
          </button>
        </form>
        <p className="text-caption mt-6 text-center">
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-medium text-[var(--foreground)] underline hover:no-underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback variant="centered" />}>
      <LoginForm />
    </Suspense>
  );
}
