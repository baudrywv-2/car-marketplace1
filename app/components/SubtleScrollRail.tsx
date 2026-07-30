"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/app/contexts/LocaleContext";

type Props = {
  children: ReactNode;
  className?: string;
  stepRatio?: number;
  variant?: "strip" | "cards";
  autoPlayMs?: number;
  paused?: boolean;
  onUserScroll?: () => void;
};

function readEdges(el: HTMLElement | null) {
  if (!el) return { left: false, right: false, max: 0 };
  const max = el.scrollWidth - el.clientWidth;
  if (max <= 2) return { left: false, right: false, max: 0 };
  return {
    left: el.scrollLeft > 2,
    right: el.scrollLeft < max - 2,
    max,
  };
}

/** Horizontal rail with edge fades + subtle gold chevrons when content overflows. */
export default function SubtleScrollRail({
  children,
  className = "",
  stepRatio = 0.7,
  variant = "cards",
  autoPlayMs,
  paused = false,
  onUserScroll,
}: Props) {
  const { t } = useLocale();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false, max: 0 });

  const refresh = useCallback(() => {
    setEdges(readEdges(scrollerRef.current));
  }, []);

  const scrollByDir = useCallback(
    (dir: -1 | 1, wrap = false) => {
      const el = scrollerRef.current;
      if (!el) return;

      // If the rail grew with its content, pin width so overflow can scroll
      const parentW = el.parentElement?.clientWidth ?? 0;
      if (parentW > 0 && el.scrollWidth <= el.clientWidth + 2) {
        el.style.maxWidth = `${parentW}px`;
      }

      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      if (max < 2) {
        refresh();
        return;
      }

      // Prefer snapping to next/prev child — more reliable than bare scrollBy
      const items = Array.from(el.children) as HTMLElement[];
      if (items.length > 0) {
        const x = el.scrollLeft;
        let idx = 0;
        for (let i = 0; i < items.length; i++) {
          if (items[i].offsetLeft <= x + 12) idx = i;
          else break;
        }
        let next = idx + dir;
        if (wrap) {
          if (next >= items.length) next = 0;
          if (next < 0) next = items.length - 1;
        } else {
          next = Math.max(0, Math.min(items.length - 1, next));
        }
        if (next === idx && dir > 0 && idx < items.length - 1) next = idx + 1;
        if (next === idx && dir < 0 && idx > 0) next = idx - 1;

        const left = Math.max(0, Math.min(max, items[next].offsetLeft));
        el.scrollTo({ left, behavior: "smooth" });
        window.setTimeout(refresh, 350);
        return;
      }

      const amount = Math.max(160, Math.floor(el.clientWidth * stepRatio));
      let target = el.scrollLeft + dir * amount;
      if (wrap && dir > 0 && el.scrollLeft >= max - 8) target = 0;
      else if (wrap && dir < 0 && el.scrollLeft <= 8) target = max;
      else target = Math.max(0, Math.min(max, target));
      el.scrollTo({ left: target, behavior: "smooth" });
      window.setTimeout(refresh, 350);
    },
    [stepRatio, refresh]
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const pin = () => {
      const parentW = el.parentElement?.clientWidth ?? 0;
      if (parentW > 0) el.style.maxWidth = `${parentW}px`;
      refresh();
    };

    pin();
    const onScroll = () => refresh();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(pin) : null;
    ro?.observe(el);
    if (el.parentElement) ro?.observe(el.parentElement);
    window.addEventListener("resize", pin);
    const t1 = window.setTimeout(pin, 50);
    const t2 = window.setTimeout(pin, 400);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      window.removeEventListener("resize", pin);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [refresh, children]);

  useEffect(() => {
    if (!autoPlayMs || paused) return;
    const id = window.setInterval(() => scrollByDir(1, true), autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, paused, scrollByDir]);

  const isStrip = variant === "strip";
  const hasOverflow = edges.max > 2;
  const btnBase = isStrip
    ? "absolute top-0 z-[3] flex h-full w-9 items-center justify-center bg-black/40 text-[var(--accent)] transition hover:bg-black/80 disabled:pointer-events-none disabled:opacity-0"
    : "absolute top-[32%] z-[3] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[var(--accent)]/45 bg-black/70 text-[var(--accent)] backdrop-blur-sm transition hover:border-[var(--accent)] hover:bg-black/90 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden">
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-[2] bg-gradient-to-r from-black to-transparent transition-opacity duration-300 ${
          isStrip ? "w-11" : "w-9 sm:w-12"
        } ${edges.left ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-[2] bg-gradient-to-l from-black to-transparent transition-opacity duration-300 ${
          isStrip ? "w-11" : "w-9 sm:w-12"
        } ${edges.right ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      />

      <button
        type="button"
        aria-label={t("previous")}
        disabled={isStrip ? !edges.left : !hasOverflow}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUserScroll?.();
          scrollByDir(-1, !isStrip);
        }}
        className={`${btnBase} left-0`}
      >
        <span aria-hidden className={`leading-none ${isStrip ? "text-base" : "text-xl"}`}>
          ‹
        </span>
      </button>
      <button
        type="button"
        aria-label={t("next")}
        disabled={isStrip ? !edges.right : !hasOverflow}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUserScroll?.();
          scrollByDir(1, !isStrip);
        }}
        className={`${btnBase} right-0`}
      >
        <span aria-hidden className={`leading-none ${isStrip ? "text-base" : "text-xl"}`}>
          ›
        </span>
      </button>

      <div
        ref={scrollerRef}
        onTouchStart={() => onUserScroll?.()}
        className={`relative flex w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
