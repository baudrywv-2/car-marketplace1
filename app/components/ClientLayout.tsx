"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { LocaleProvider, useLocale } from "@/app/contexts/LocaleContext";
import { ToastProvider } from "@/app/contexts/ToastContext";
import AuthNav from "./AuthNav";
import CookieNotice from "./CookieNotice";
import LogVisit from "./LogVisit";
import LocaleSwitcher from "./LocaleSwitcher";
import Logo from "./Logo";

function Header() {
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  const mobileMenu = mobileOpen && typeof document !== "undefined" ? (
    <>
      <div
        className="fixed inset-0 bg-black/70"
        style={{ zIndex: 99998 }}
        aria-hidden
        onClick={() => setMobileOpen(false)}
      />
      <div
        className="fixed inset-0 flex flex-col bg-[#18181b] text-[#fafafa]"
        style={{ zIndex: 99999 }}
      >
        <div className="flex h-12 min-h-[44px] shrink-0 items-center justify-between border-b border-[#27272a] px-4 pt-[env(safe-area-inset-top)]">
          <Logo showTagline={false} size="sm" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded text-[#fafafa] hover:bg-[#27272a]"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-4 pt-3">
          <Link
            href="/cars"
            onClick={() => setMobileOpen(false)}
            className="py-2.5 text-[11px] font-medium text-[#fafafa] hover:text-[#eab308]"
          >
            {t("browseCars")}
          </Link>
          <Link
            href="/rent"
            onClick={() => setMobileOpen(false)}
            className="inline-flex px-3 py-2 text-[11px] font-medium text-white bg-[#ef4444] hover:bg-[#f87171] rounded"
          >
            {t("rentCars")}
          </Link>
          <div className="my-1 border-t border-[#27272a]" />
          <LocaleSwitcher mobile inOverlay onNavigate={() => setMobileOpen(false)} />
          <div className="my-1 border-t border-[#27272a]" />
          <AuthNav mobile onNavigate={() => setMobileOpen(false)} />
        </nav>
      </div>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl safe-area-top">
      <div className="mx-auto flex h-12 min-h-[44px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo showTagline={false} size="md" />

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/cars"
            className="text-[11px] font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            {t("browseCars")}
          </Link>
          <Link
            href="/rent"
            className="btn-rent px-3 py-1.5 text-[11px] font-medium"
          >
            {t("rentCars")}
          </Link>
          <div className="h-4 w-px bg-[var(--border)]" aria-hidden />
          <LocaleSwitcher />
          <div className="h-4 w-px bg-[var(--border)]" aria-hidden />
          <AuthNav />
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] text-[var(--foreground)] hover:bg-[var(--border)] md:hidden transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu: rendered via portal to body, always on top */}
      {typeof document !== "undefined" && createPortal(mobileMenu, document.body)}
    </header>
  );
}

function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] safe-area-bottom text-[9px] sm:text-[10px]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <Logo showTagline size="sm" className="scale-95 origin-left [&_.font-logo]:text-[13px] [&_.font-mono]:text-[10px]" />
            <p className="mt-0.5 max-w-xs text-[10px] text-[var(--muted-foreground)]">
              {t("tagline")}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-0.5 sm:flex-nowrap sm:gap-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {t("marketplace")}
              </span>
              <Link href="/cars" className="link-accent">
                {t("browseCars")}
              </Link>
              <Link href="/rent" className="link-accent">
                {t("rentCars")}
              </Link>
              <Link href="/dashboard/cars/new" className="link-accent">
                {t("listYourCar")}
              </Link>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {t("legal")}
              </span>
              <Link href="/terms" className="link-accent">
                {t("termsConditions")}
              </Link>
              <Link href="/privacy" className="link-accent">
                {t("privacyPolicy")}
              </Link>
              <Link href="/disclaimer" className="link-accent">
                {t("disclaimer")}
              </Link>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {t("help")}
              </span>
              <Link href="/faq" className="link-accent">
                {t("faq")}
              </Link>
              <Link href="/site-map" className="link-accent">
                {t("siteMap")}
              </Link>
            </div>
          </nav>
        </div>
        <div className="mt-5 border-t border-[var(--border)] pt-3">
          <p className="text-center text-[9px] text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} {t("siteName")}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ToastProvider>
        <Header />
        <main className="min-w-0 overflow-x-hidden">{children}</main>
        <Footer />
        <CookieNotice />
        <LogVisit />
      </ToastProvider>
    </LocaleProvider>
  );
}
