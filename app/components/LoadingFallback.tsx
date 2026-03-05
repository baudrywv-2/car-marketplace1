"use client";

import { useLocale } from "@/app/contexts/LocaleContext";

type Props = { variant?: "default" | "centered" };

export default function LoadingFallback({ variant = "default" }: Props) {
  const { t } = useLocale();
  const text = <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>;
  if (variant === "centered") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        {text}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {text}
    </div>
  );
}
