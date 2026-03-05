"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";

const STORAGE_KEY = "drccars-cookie-consent";

export default function CookieNotice() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
    } catch {
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-[var(--muted-foreground)]">
          {t("cookieNotice")}{" "}
          <Link href="/privacy" className="underline hover:no-underline">
            {t("privacyPolicy")}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="btn-primary min-h-[44px] shrink-0 px-4 text-caption"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
