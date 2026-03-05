"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import TurnstileWidget from "@/app/components/TurnstileWidget";

function isValidPhone(val: string): boolean {
  const digits = val.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const turnstileRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setError(t("signupNameRequired") || "Full name is required.");
      return;
    }
    if (!trimmedEmail) {
      setError(t("signupEmailRequired") || "Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      setError(t("signupPasswordRequired") || "Password must be at least 6 characters.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t("signupPhoneInvalid") || "Please enter a valid phone number (9–15 digits).");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError(t("signupVerifyRequired") || "Please complete the verification below.");
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError(t("signupAcceptRequired") || "You must accept the Terms and Conditions and Privacy Policy to create an account.");
      return;
    }
    setLoading(true);
    if (turnstileToken) {
      const verifyRes = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const verifyData = (await verifyRes.json()) as { success?: boolean; error?: string };
      if (!verifyData.success) {
        setError(verifyData.error || "Verification failed. Please try again.");
        setLoading(false);
        return;
      }
    }
    const phoneNormalized = phone.replace(/\D/g, "");
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, phone: phoneNormalized },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="card-premium w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-heading mb-6 text-[var(--foreground)]">Create account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="fullName" className="text-caption mb-1.5 block">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="input-premium"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-caption mb-1.5 block">
              {t("signupPhone")} <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("signupPhonePlaceholder")}
              required
              className="input-premium"
            />
            <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{t("signupPhoneHelp")}</p>
          </div>
          <div>
            <label htmlFor="email" className="text-caption mb-1.5 block">
              Email <span className="text-red-500">*</span>
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
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-premium"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-2 text-small text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>
                {t("acceptTerms")}{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                  ({t("termsConditions")})
                </Link>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-small text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span>
                {t("acceptPrivacy")}{" "}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                  ({t("privacyPolicy")})
                </Link>
              </span>
            </label>
          </div>
          {turnstileRequired && (
            <div>
              <TurnstileWidget
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                size="compact"
              />
            </div>
          )}
          <div>
            <span className="text-caption mb-2 block">I want to</span>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-small text-[var(--foreground)]">
                <input
                  type="radio"
                  name="role"
                  checked={role === "buyer"}
                  onChange={() => setRole("buyer")}
                  className="h-4 w-4"
                />
                Browse / buy
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-small text-[var(--foreground)]">
                <input
                  type="radio"
                  name="role"
                  checked={role === "seller"}
                  onChange={() => setRole("seller")}
                  className="h-4 w-4"
                />
                Sell cars
              </label>
            </div>
          </div>
          {error && <p className="text-small text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="text-caption mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--foreground)] underline hover:no-underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
