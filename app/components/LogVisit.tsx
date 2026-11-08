"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const VISIT_KEY = "drccars-visit-logged";

export default function LogVisit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(VISIT_KEY)) return;
    } catch {
      return;
    }

    const run = () => {
      try {
        if (sessionStorage.getItem(VISIT_KEY)) return;
        void supabase
          .from("page_views")
          .insert({})
          .then(() => {
            try {
              sessionStorage.setItem(VISIT_KEY, "1");
            } catch {
              /* ignore */
            }
          });
      } catch {
        /* ignore */
      }
    };

    const w = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(run, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = globalThis.setTimeout(run, 2000);
    return () => globalThis.clearTimeout(t);
  }, []);

  return null;
}
