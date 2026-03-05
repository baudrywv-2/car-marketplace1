"use client";

import { useLocale } from "@/app/contexts/LocaleContext";

type Props = { className?: string; width?: "full" | "sidebar" };

export default function AdPlacement({ className = "", width = "full" }: Props) {
  const { t } = useLocale();
  return (
    <div
      className={`flex min-h-[120px] items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--background)] text-caption text-[var(--muted-foreground)] ${className}`}
      style={width === "sidebar" ? { minWidth: 160 } : undefined}
    >
      {t("adPlacement")}
    </div>
  );
}
