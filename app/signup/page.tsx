"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import TurnstileWidget from "@/app/components/TurnstileWidget";
import { isValidDRCPhone } from "@/lib/phone-validation";
import { DRC_LOCATIONS, SITE_URL } from "@/lib/constants";
import AuthShell from "@/app/components/AuthShell";

type AccountType = "individual" | "company";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
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
    const trimmedCity = city.trim();
    const trimmedCompany = companyName.trim();

    if (!trimmedName) {
      setError(t("signupNameRequired"));
      return;
    }
    if (!trimmedEmail) {
      setError(t("signupEmailRequired"));
      return;
    }
    if (!password || password.length < 6) {
      setError(t("signupPasswordRequired"));
      return;
    }
    if (!isValidDRCPhone(phone)) {
      setError(t("signupPhoneInvalid"));
      return;
    }
    if (role === "seller" && accountType === "company" && !trimmedCompany) {
      setError(t("companyBrandRequired"));
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setError(t("signupVerifyRequired"));
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError(t("signupAcceptRequired"));
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
        setError(verifyData.error || t("verificationFailed"));
        setLoading(false);
        return;
      }
    }

    const phoneNormalized = phone.replace(/\D/g, "");
    const resolvedCompany =
      role === "seller"
        ? accountType === "company"
          ? trimmedCompany
          : trimmedCompany || null
        : null;

    const meta: Record<string, string> = {
      full_name: trimmedName,
      role,
      phone: phoneNormalized,
      whatsapp: phoneNormalized,
    };
    if (resolvedCompany) meta.company_name = resolvedCompany;
    if (role === "seller" && trimmedCity) meta.city = trimmedCity;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: meta,
        emailRedirectTo: `${SITE_URL}/login`,
      },
    });

    // Best-effort profile upsert when session exists (email confirm may be off).
    // Safe if trigger already ran — upsert only fills missing seller fields.
    if (!signUpError && signUpData.user) {
      try {
        const { syncSellerProfileFromAuth } = await import("@/lib/seller-profile");
        const {
          data: { user: sessionUser },
        } = await supabase.auth.getUser();
        if (sessionUser) {
          await syncSellerProfileFromAuth(supabase, sessionUser);
        }
        // No session yet (email confirmation required) — metadata still carries fields for trigger / first login sync.
      } catch {
        /* ignore — trigger / later sync will fill profile */
      }
    }

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Email confirmation required — no session until the user clicks the link.
    if (!signUpData.session) {
      const q = new URLSearchParams({ email: trimmedEmail, role });
      router.push(`/signup/confirm?${q.toString()}`);
      return;
    }

    if (role === "seller") {
      router.push("/dashboard/seller/welcome");
    } else {
      router.push("/dashboard/buyer");
    }
    router.refresh();
  }

  return (
    <AuthShell
      title={t("signupWelcome")}
      subtitle={role === "seller" ? t("signupSellerHint") : t("signupSubtitle")}
      wide={role === "seller"}
      footer={
        <p className="text-caption mt-6 text-center text-[var(--muted-foreground)]">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
            {t("logIn")}
          </Link>
        </p>
      }
    >
      <h2 className="mb-1 font-mono text-base font-semibold text-[var(--foreground)] sm:text-lg">{t("createAccount")}</h2>
      <p className="mb-4 text-[11px] text-[var(--muted-foreground)] sm:mb-5">
        {role === "buyer" ? t("signupBuyerHint") : t("signupSellerHint")}
      </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
          <div>
            <span className="text-caption mb-2 block">{t("iWantTo")}</span>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border px-2 py-3 text-center text-[11px] transition sm:text-xs ${
                  role === "buyer"
                    ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  className="sr-only"
                  checked={role === "buyer"}
                  onChange={() => setRole("buyer")}
                />
                {t("roleBuyer")}
              </label>
              <label
                className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border px-2 py-3 text-center text-[11px] transition sm:text-xs ${
                  role === "seller"
                    ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  className="sr-only"
                  checked={role === "seller"}
                  onChange={() => setRole("seller")}
                />
                {t("roleSeller")}
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="text-caption mb-1.5 block">
              {t("fullName")} <span className="text-red-500">*</span>
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

          {role === "seller" && (
            <>
              <fieldset>
                <legend className="mb-2 text-caption font-medium text-[var(--foreground)]">{t("accountType")}</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border px-2 py-3 text-center text-[11px] transition sm:text-xs ${
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
                    className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border px-2 py-3 text-center text-[11px] transition sm:text-xs ${
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

              <div>
                <label htmlFor="companyName" className="text-caption mb-1.5 block">
                  {accountType === "company" ? (
                    <>
                      {t("companyBrandName")} <span className="text-red-500">*</span>
                    </>
                  ) : (
                    t("tradingAsOptional")
                  )}
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required={accountType === "company"}
                  placeholder={accountType === "company" ? "e.g. Auto Kinshasa" : "e.g. Jean Motors"}
                  className="input-premium"
                />
              </div>

              <div>
                <label htmlFor="city" className="text-caption mb-1.5 block">
                  {t("city")}
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-premium"
                >
                  <option value="">{t("selectTownCity")}</option>
                  {DRC_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

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
              {t("email")} <span className="text-red-500">*</span>
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
              {t("password")} <span className="text-red-500">*</span>
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
            <label className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-2 text-[11px] text-[var(--muted-foreground)] sm:min-h-0">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 sm:h-3 sm:w-3"
              />
              <span>{t("showPassword")}</span>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex min-h-[44px] cursor-pointer items-start gap-2 py-1 text-small text-[var(--foreground)] sm:min-h-0">
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
            <label className="flex min-h-[44px] cursor-pointer items-start gap-2 py-1 text-small text-[var(--foreground)] sm:min-h-0">
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

          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-accent w-full min-h-[44px] disabled:opacity-50">
            {loading ? t("creatingAccount") : t("signUp")}
          </button>
        </form>
    </AuthShell>
  );
}
