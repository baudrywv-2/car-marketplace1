"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Locale } from "@/lib/translations";
import type { Currency } from "@/lib/constants";

const LOCALE_KEY = "car-mkt-locale";
const CURRENCY_KEY = "car-mkt-currency";

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  t: (key: keyof typeof translations.en) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const l = (localStorage.getItem(LOCALE_KEY) as Locale) || "en";
    const c = (localStorage.getItem(CURRENCY_KEY) as Currency) || "USD";
    const locale = l in translations ? l : "en";
    setLocaleState(locale);
    setCurrencyState(c === "CDF" ? "CDF" : "USD");
    document.documentElement.lang = locale === "ln" ? "ln" : locale === "sw" ? "sw" : locale;
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_KEY, l);
      document.documentElement.lang = l === "ln" ? "ln" : l === "sw" ? "sw" : l;
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") localStorage.setItem(CURRENCY_KEY, c);
  }, []);

  const t = useCallback(
    (key: keyof typeof translations.en) => translations[locale][key] ?? translations.en[key],
    [locale]
  );

  if (!mounted) {
    return (
      <LocaleContext.Provider
        value={{
          locale: "en",
          setLocale,
          currency: "USD",
          setCurrency,
          t: (key) => translations.en[key],
        }}
      >
        {children}
      </LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, currency, setCurrency, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
