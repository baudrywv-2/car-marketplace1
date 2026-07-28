"use client";

import { useEffect } from "react";
import Link from "next/link";
import LogoMark from "./components/LogoMark";
import { useLocale } from "@/app/contexts/LocaleContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      <LogoMark size={64} className="mb-6 opacity-90" />
      <h1 className="text-heading mb-2 text-center text-[var(--foreground)]">{t("somethingWentWrong")}</h1>
      <p className="text-body mb-8 max-w-sm text-center text-[var(--muted-foreground)]">
        {t("errorOccurred")}
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="btn-secondary">
          {t("tryAgain")}
        </button>
        <Link href="/" className="btn-accent">
          {t("notFoundCta")}
        </Link>
      </div>
    </div>
  );
}
