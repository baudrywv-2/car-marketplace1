"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";

type Props = {
  ids: string[];
  onClear: () => void;
  onRemove?: (id: string) => void;
};

export default function CompareBar({ ids, onClear }: Props) {
  const { t } = useLocale();
  if (ids.length === 0) return null;

  const href = `/compare?ids=${ids.join(",")}`;

  return (
    <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(36rem,calc(100%-2rem))] sm:-translate-x-1/2">
      <div className="animate-slide-up-in border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md sm:rounded-xl sm:border sm:shadow-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0 text-center sm:text-left">
            <p className="truncate text-[12px] font-semibold text-[var(--foreground)]">
              {t("compareBarTitle")}
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {ids.length < 2 ? t("compareMaxHint") : t("compareSelected").replace("{n}", String(ids.length))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
            <button
              type="button"
              onClick={onClear}
              className="min-h-[44px] rounded border border-[var(--border)] px-3 text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:min-h-0 sm:py-2 sm:text-[11px]"
            >
              {t("clearCompare")}
            </button>
            <Link
              href={href}
              className={`btn-accent flex min-h-[44px] items-center justify-center px-4 text-[12px] sm:min-h-0 sm:py-2 sm:text-[11px] ${ids.length < 2 ? "pointer-events-none opacity-40" : ""}`}
              aria-disabled={ids.length < 2}
            >
              {t("compareSelected").replace("{n}", String(ids.length))}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
