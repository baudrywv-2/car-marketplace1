"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, type Locale } from "@/lib/translations";
import type { Currency } from "@/lib/constants";

const LOCALE_KEY = "car-mkt-locale";
const CURRENCY_KEY = "car-mkt-currency";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isLocale(v: string | undefined | null): v is Locale {
  return !!v && v in translations;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function setDocumentLang(l: Locale) {
  document.documentElement.lang = l === "ln" ? "ln" : l === "sw" ? "sw" : l;
}

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  t: (key: keyof typeof translations.en) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

type ProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialCurrency?: Currency;
};

export function LocaleProvider({
  children,
  initialLocale = "fr",
  initialCurrency = "USD",
}: ProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : "fr"
  );
  const [currency, setCurrencyState] = useState<Currency>(
    initialCurrency === "CDF" ? "CDF" : "USD"
  );

  // Sync from localStorage once if cookie wasn't set yet (older clients)
  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_KEY);
    const storedCurrency = localStorage.getItem(CURRENCY_KEY);
    if (isLocale(storedLocale) && storedLocale !== locale) {
      setLocaleState(storedLocale);
      writeCookie(LOCALE_KEY, storedLocale);
      setDocumentLang(storedLocale);
    } else {
      writeCookie(LOCALE_KEY, locale);
      setDocumentLang(locale);
    }
    if (storedCurrency === "CDF" || storedCurrency === "USD") {
      if (storedCurrency !== currency) setCurrencyState(storedCurrency);
      writeCookie(CURRENCY_KEY, storedCurrency);
    } else {
      writeCookie(CURRENCY_KEY, currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time hydrate sync
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
    writeCookie(LOCALE_KEY, l);
    setDocumentLang(l);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(CURRENCY_KEY, c);
    writeCookie(CURRENCY_KEY, c);
  }, []);

  const t = useCallback(
    (key: keyof typeof translations.en) => {
      const local = translations[locale][key];
      const en = translations.en[key];
      return (local && String(local).trim()) || en || String(key);
    },
    [locale]
  );

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
