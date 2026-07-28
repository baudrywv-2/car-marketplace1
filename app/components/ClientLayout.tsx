"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleProvider, useLocale } from "@/app/contexts/LocaleContext";
import { ToastProvider } from "@/app/contexts/ToastContext";
import AuthNav from "./AuthNav";
import CookieNotice from "./CookieNotice";
import LogVisit from "./LogVisit";
import LocaleSwitcher from "./LocaleSwitcher";
import Logo from "./Logo";

function AnimatedMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main key={pathname} className="animate-page-enter flex min-w-0 flex-1 flex-col overflow-x-hidden">
      {children}
    </main>
  );
}

function Header() {
  const { t } = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMenu = () => setMobileOpen(false);

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
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const mobileMenu = mobileOpen && typeof document !== "undefined" ? (
    <>
      <div
        className="animate-menu-backdrop fixed inset-0 bg-black/75 backdrop-blur-[2px]"
        style={{ zIndex: 99998 }}
        aria-hidden
        onClick={closeMenu}
      />
      <div
        className="animate-menu-panel mobile-menu-panel fixed inset-0 flex flex-col text-[var(--foreground)]"
        style={{ zIndex: 99999 }}
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4 pt-[env(safe-area-inset-top)]">
          <Logo showTagline={false} size="md" onNavigate={closeMenu} />
          <button
            type="button"
            onClick={closeMenu}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--border)] hover:text-[var(--foreground)]"
            aria-label={t("closeMenu")}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <nav className="mobile-menu-stagger flex flex-col gap-1 px-5 pt-5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {t("marketplace")}
            </p>
            <Link
              href="/cars"
              onClick={closeMenu}
              className="mobile-nav-link"
              data-active={isActive("/cars")}
            >
              {t("browseCars")}
              <span className="text-[var(--muted-foreground)]" aria-hidden>→</span>
            </Link>
            <Link
              href="/compare"
              onClick={closeMenu}
              className="mobile-nav-link"
              data-active={isActive("/compare")}
            >
              {t("compare")}
              <span className="text-[var(--muted-foreground)]" aria-hidden>→</span>
            </Link>
            <Link
              href="/rent"
              onClick={closeMenu}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent-red)] px-4 py-3 font-mono text-sm font-semibold tracking-wide text-white shadow-[0_8px_28px_var(--accent-red-glow)] transition-transform active:scale-[0.98]"
              data-active={isActive("/rent")}
            >
              {t("rentCars")}
            </Link>
          </nav>

          <div className="mt-6 px-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {t("language")} · {t("currencyLabel")}
            </p>
            <LocaleSwitcher mobile inOverlay onNavigate={closeMenu} />
          </div>

          <div className="mt-auto border-t border-[var(--border)] bg-[var(--background)]/80 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 backdrop-blur-sm">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {t("account")}
            </p>
            <AuthNav mobile onNavigate={closeMenu} />
          </div>
        </div>
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
            href="/compare"
            className="text-[11px] font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            {t("compare")}
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
          aria-label={t("openMenu")}
          aria-expanded={mobileOpen}
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
    <footer className="mt-0 border-t border-[var(--border)] bg-[var(--background)] safe-area-bottom text-[9px] sm:text-[10px]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <Logo showTagline size="sm" className="scale-95 origin-left [&_.font-logo]:text-[13px] [&_.font-mono]:text-[10px]" />
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
            © {new Date().getFullYear()} {t("siteName")}. {t("allRightsReserved")}
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
        <div className="flex min-h-dvh flex-col">
          <Header />
          <AnimatedMain>{children}</AnimatedMain>
          <Footer />
        </div>
        <CookieNotice />
        <LogVisit />
      </ToastProvider>
    </LocaleProvider>
  );
}
