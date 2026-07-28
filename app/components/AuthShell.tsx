"use client";

import Image from "next/image";
import Logo from "./Logo";
import { useLocale } from "@/app/contexts/LocaleContext";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children, wide, footer }: Props) {
  const { t } = useLocale();
  const trustItems = [t("loginTrustFree"), t("loginTrustSafe"), t("loginTrustLocal")];

  return (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="https://unsplash.com/photos/ZZlWF_nRyz0/download?force=true&w=1600&q=80"
          alt=""
          fill
          className="object-cover object-[center_30%] opacity-35 sm:object-center sm:opacity-40"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-[var(--background)] lg:bg-gradient-to-br lg:from-black lg:via-black/85 lg:to-[var(--background)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 safe-area-bottom sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:gap-12 lg:py-14 xl:gap-16">
        {/* Brand column — compact on mobile, full on desktop */}
        <div className="mb-5 shrink-0 animate-fade-up sm:mb-8 lg:mb-0 lg:max-w-md lg:flex-1 lg:pr-4">
          <Logo showTagline={false} size="md" className="min-h-[44px]" />
          <h1 className="mt-3 font-mono text-[1.35rem] font-bold leading-[1.15] tracking-[-0.04em] text-white sm:mt-4 sm:text-3xl lg:text-[2.35rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-md text-[12px] leading-relaxed text-white/65 sm:mt-3 sm:text-[13px] sm:text-sm">
            {subtitle}
          </p>
          <ul className="mt-4 hidden gap-2.5 lg:mt-6 lg:flex lg:flex-col">
            {trustItems.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] text-white/70 backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] animate-soft-pulse" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Form column */}
        <div
          className={`mx-auto w-full animate-fade-up lg:mx-0 lg:shrink-0 ${wide ? "max-w-md lg:max-w-lg" : "max-w-sm lg:max-w-md"}`}
          style={{ animationDelay: "60ms" }}
        >
          <div className="rounded-xl border border-white/10 bg-[var(--card)]/95 p-4 shadow-[var(--shadow-xl)] backdrop-blur-md sm:p-6 md:p-8">
            {children}
            {footer}
          </div>
          <ul className="mt-4 flex flex-wrap justify-center gap-2 lg:hidden">
            {trustItems.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/55"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
