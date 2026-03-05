"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/app/contexts/LocaleContext";
import { CURRENCIES } from "@/lib/constants";
import type { Locale } from "@/lib/translations";

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", fr: "FR", ln: "LN", sw: "SW" };
const LOCALES: Locale[] = ["en", "fr", "ln", "sw"];

type Props = { mobile?: boolean; onNavigate?: () => void };

function useCloseOnClickOutside(ref: React.RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isOpen, onClose, ref]);
}

function LangDropdown({ mobile }: { mobile?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useCloseOnClickOutside(ref, open, () => setOpen(false));

  useEffect(() => {
    if (open && mobile && btnRef.current && typeof document !== "undefined") {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 64) });
    }
  }, [open, mobile]);

  const dropdownList = open ? (
    <ul
      className="fixed z-[100] min-w-[4rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-1 shadow-[var(--shadow-lg)]"
      style={mobile ? { top: pos.top, left: pos.left, width: pos.width } : undefined}
      role="listbox"
    >
      {LOCALES.map((loc) => (
        <li key={loc} role="option" aria-selected={locale === loc}>
          <button
            type="button"
            onClick={() => { setLocale(loc); setOpen(false); }}
            className={`block w-full min-h-[44px] px-3 py-3 text-left text-[10px] font-medium md:min-h-0 md:py-2.5 ${locale === loc ? "bg-[var(--accent-vivid)] text-white" : "text-[var(--foreground)] hover:bg-[var(--border)]"}`}
          >
            {LOCALE_LABELS[loc]}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--border)] md:min-h-[2.25rem] md:min-w-0 md:py-1.5"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Language"
      >
        <span>{LOCALE_LABELS[locale]}</span>
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {mobile && typeof document !== "undefined"
        ? createPortal(dropdownList, document.body)
        : dropdownList && (
            <ul
              className="absolute left-0 top-full z-50 mt-1 min-w-[4rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-1 shadow-[var(--shadow-lg)]"
              role="listbox"
            >
              {LOCALES.map((loc) => (
                <li key={loc} role="option" aria-selected={locale === loc}>
                  <button
                    type="button"
                    onClick={() => { setLocale(loc); setOpen(false); }}
                    className={`block w-full px-3 py-2 text-left text-[10px] font-medium ${locale === loc ? "bg-[var(--accent-vivid)] text-white" : "text-[var(--foreground)] hover:bg-[var(--border)]"}`}
                  >
                    {LOCALE_LABELS[loc]}
                  </button>
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}

function CurrencyDropdown({ mobile }: { mobile?: boolean }) {
  const { currency, setCurrency } = useLocale();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useCloseOnClickOutside(ref, open, () => setOpen(false));

  useEffect(() => {
    if (open && mobile && btnRef.current && typeof document !== "undefined") {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 72) });
    }
  }, [open, mobile]);

  const dropdownList = open ? (
    <ul
      className="fixed z-[100] min-w-[4.5rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-1 shadow-[var(--shadow-lg)]"
      style={mobile ? { top: pos.top, left: pos.left, width: pos.width } : undefined}
      role="listbox"
    >
      {CURRENCIES.map((c) => (
        <li key={c} role="option" aria-selected={currency === c}>
          <button
            type="button"
            onClick={() => { setCurrency(c); setOpen(false); }}
            className={`block w-full min-h-[44px] px-3 py-3 text-left text-[10px] font-medium md:min-h-0 md:py-2.5 ${currency === c ? "bg-[var(--accent-vivid)] text-white" : "text-[var(--foreground)] hover:bg-[var(--border)]"}`}
          >
            {c}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--border)] md:min-h-[2.25rem] md:min-w-0 md:py-1.5"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Currency"
      >
        <span>{currency}</span>
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {mobile && typeof document !== "undefined"
        ? createPortal(dropdownList, document.body)
        : dropdownList && (
            <ul
              className="absolute left-0 top-full z-50 mt-1 min-w-[4.5rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-1 shadow-[var(--shadow-lg)]"
              role="listbox"
            >
              {CURRENCIES.map((c) => (
                <li key={c} role="option" aria-selected={currency === c}>
                  <button
                    type="button"
                    onClick={() => { setCurrency(c); setOpen(false); }}
                    className={`block w-full px-3 py-2 text-left text-[10px] font-medium ${currency === c ? "bg-[var(--accent-vivid)] text-white" : "text-[var(--foreground)] hover:bg-[var(--border)]"}`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}

export default function LocaleSwitcher({ mobile }: Props) {
  const container = mobile ? "flex flex-col gap-4" : "flex items-center gap-2";

  return (
    <div className={container}>
      <LangDropdown mobile={mobile} />
      <CurrencyDropdown mobile={mobile} />
    </div>
  );
}
