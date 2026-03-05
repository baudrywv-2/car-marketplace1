"use client";

import Link from "next/link";
import { useLocale } from "@/app/contexts/LocaleContext";
import LogoMark from "./LogoMark";

type Props = {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function Logo({ showTagline = false, size = "md", className = "" }: Props) {
  const { t } = useLocale();
  const sizes = {
    sm: { icon: 24, text: "text-[13px]" },
    md: { icon: 30, text: "text-[15px]" },
    lg: { icon: 36, text: "text-[18px]" },
  }[size];

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 transition-opacity hover:opacity-90 ${className}`}
    >
      <LogoMark size={sizes.icon} className="shrink-0" />
      <span className="flex flex-col">
        <span className={`${sizes.text} font-display text-[var(--foreground)]`}>
          {t("siteName")}
        </span>
        {showTagline && (
          <span className="text-[10px] font-medium text-[var(--muted-foreground)] leading-tight font-mono">
            {t("tagline")}
          </span>
        )}
      </span>
    </Link>
  );
}
