"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";

export default function SiteMapContent() {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-heading mb-6 text-[var(--foreground)]">{t("siteMap")}</h1>
      <p className="text-body mb-8 text-[var(--muted-foreground)]">
        {t("siteMapDesc")}
      </p>

      <section className="mb-8">
        <h2 className="text-subheading mb-4 text-[var(--foreground)]">{t("main")}</h2>
        <ul className="space-y-2 text-body">
          <li><Link href="/" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("home")}</Link></li>
          <li><Link href="/cars" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("browseCars")}</Link></li>
          <li><Link href="/rent" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("rentCars")}</Link></li>
          <li><Link href="/favorites" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("myFavorites")}</Link></li>
          <li><Link href="/compare" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("compareBarTitle")}</Link></li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-subheading mb-4 text-[var(--foreground)]">{t("account")}</h2>
        <ul className="space-y-2 text-body">
          <li><Link href="/login" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("logIn")}</Link></li>
          <li><Link href="/signup" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("signUp")}</Link></li>
          <li><Link href="/dashboard" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("myDashboard")}</Link></li>
          <li><Link href="/dashboard/cars/new" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("listACar")}</Link></li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-subheading mb-4 text-[var(--foreground)]">{t("legal")}</h2>
        <ul className="space-y-2 text-body">
          <li><Link href="/terms" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("termsConditions")}</Link></li>
          <li><Link href="/privacy" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("privacyPolicy")}</Link></li>
          <li><Link href="/disclaimer" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("disclaimer")}</Link></li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-subheading mb-4 text-[var(--foreground)]">{t("help")}</h2>
        <ul className="space-y-2 text-body">
          <li><Link href="/faq" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("faq")}</Link></li>
          <li><Link href="/site-map" className="text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">{t("siteMap")}</Link></li>
        </ul>
      </section>

      <p className="text-caption text-[var(--muted-foreground)]">
        {t("siteMapListingsNote")}
      </p>

      <p className="mt-8">
        <Link href="/" className="text-[10px] font-medium text-[var(--foreground)] hover:underline">
          {t("backToHome")}
        </Link>
      </p>
    </div>
  );
}
