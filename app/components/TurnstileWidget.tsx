"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        opts: { sitekey: string; callback?: (token: string) => void; "error-callback"?: (code?: string) => void; theme?: string; size?: string }
      ) => string;
      remove?: (id: string) => void;
      reset?: (id: string) => void;
    };
    onTurnstileReady?: () => void;
  }
}

type Props = {
  onSuccess: (token: string) => void;
  onError?: (code?: string) => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
};

export default function TurnstileWidget({ onSuccess, onError, theme = "auto", size = "normal" }: Props) {
  const id = useId().replace(/:/g, "");
  const containerId = `turnstile-${id}`;
  const [ready, setReady] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const renderWidget = useCallback(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey || !window.turnstile?.render) return;
    const el = document.getElementById(containerId);
    if (!el || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey,
      theme,
      size,
      callback: (token) => onSuccessRef.current(token),
      "error-callback": (code) => onErrorRef.current?.(code),
    });
  }, [containerId, theme, size]);

  useEffect(() => {
    if (ready) renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [ready, renderWidget]);

  useEffect(() => {
    window.onTurnstileReady = () => setReady(true);
    if (window.turnstile?.render) setReady(true);
    return () => {
      delete window.onTurnstileReady;
    };
  }, []);

  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!sitekey) return null;

  return (
    <>
      <link rel="preconnect" href="https://challenges.cloudflare.com" />
      <Script
        src={`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady`}
        strategy="lazyOnload"
      />
      <div id={containerId} />
    </>
  );
}
