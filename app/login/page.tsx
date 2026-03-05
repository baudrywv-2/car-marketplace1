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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-premium"
            />
          </div>
          {error && <p className="text-small text-red-600">{error}</p>}
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
