"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Password updated. You can now log in with your new password.");
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="card-premium w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-heading mb-4 text-[var(--foreground)]">Reset password</h1>
        {!hasSession ? (
          <p className="text-body text-[var(--muted-foreground)]">
            The reset link is invalid or has expired. Please request a new password reset from the{" "}
            <Link href="/login" className="underline hover:no-underline">
              login page
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="password" className="text-caption mb-1.5 block">
                New password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-premium"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-caption mb-1.5 block">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="input-premium"
              />
              <label className="mt-1 flex cursor-pointer items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-3 w-3"
                />
                <span>Show password</span>
              </label>
            </div>
            {error && <p className="text-small text-red-600">{error}</p>}
            {message && <p className="text-small text-emerald-600">{message}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? t("saving") : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

