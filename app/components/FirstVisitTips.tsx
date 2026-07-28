"use client";

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { useLocale } from "@/app/contexts/LocaleContext";
import type { translations } from "@/lib/translations";

export type TourStep = {
  targetId: string;
  messageKey: keyof typeof translations.en;
};

type Props = {
  storageKey: string;
  steps: TourStep[];
};

type Rect = { top: number; left: number; width: number; height: number };

export default function FirstVisitTips({ storageKey, steps }: Props) {
  const { t } = useLocale();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !steps.length) return;
    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {
      return;
    }
    const id = window.setTimeout(() => setActive(true), 450);
    return () => window.clearTimeout(id);
  }, [storageKey, steps.length]);

  const current = steps[step];

  useLayoutEffect(() => {
    if (!active || !current) return;

    function measure() {
      const el = document.getElementById(current.targetId);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, current, step]);

  function finish() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setActive(false);
  }

  function next() {
    if (step >= steps.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  }

  if (!active || !current) return null;

  const pad = 6;
  const bubbleBelow = !rect || rect.top + rect.height + 140 < (typeof window !== "undefined" ? window.innerHeight : 800);
  const bubbleStyle: CSSProperties = rect
    ? {
        position: "fixed",
        zIndex: 62,
        left: Math.min(Math.max(12, rect.left), (typeof window !== "undefined" ? window.innerWidth : 400) - 292),
        top: bubbleBelow ? rect.top + rect.height + 12 : Math.max(12, rect.top - 12),
        transform: bubbleBelow ? undefined : "translateY(-100%)",
        width: "min(280px, calc(100vw - 24px))",
      }
    : {
        position: "fixed",
        zIndex: 62,
        left: "50%",
        top: "40%",
        transform: "translate(-50%, -50%)",
        width: "min(280px, calc(100vw - 24px))",
      };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("tipDone")}>
      <button
        type="button"
        className="absolute inset-0 z-[51] cursor-default bg-transparent"
        aria-label={t("tipSkip")}
        onClick={finish}
      />
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[52] rounded-lg ring-2 ring-[var(--accent)]"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        />
      )}
      {!rect && <div aria-hidden className="pointer-events-none absolute inset-0 z-[52] bg-black/50" />}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-xl" style={bubbleStyle}>
        <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--muted-foreground)]">
          {t("tipStepOf").replace("{n}", String(step + 1)).replace("{total}", String(steps.length))}
        </p>
        <p className="mt-1.5 text-[13px] leading-snug text-[var(--foreground)]">{t(current.messageKey)}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {t("tipSkip")}
          </button>
          <button type="button" onClick={next} className="btn-primary px-3 py-1.5 text-[11px]">
            {step >= steps.length - 1 ? t("tipDone") : t("tipNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
