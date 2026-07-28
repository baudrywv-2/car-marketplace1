"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";

export default function NotFoundContent() {
  const { t } = useLocale();

  return (
    <>
      <h1 className="text-heading mb-2 text-center text-[var(--foreground)]">{t("notFoundTitle")}</h1>
      <p className="text-body mb-8 max-w-sm text-center text-[var(--muted-foreground)]">
        {t("notFoundDesc")}
      </p>
      <Link href="/" className="btn-accent">
        {t("notFoundCta")}
      </Link>
    </>
  );
}
