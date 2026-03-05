"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const VISIT_KEY = "drccars-visit-logged";

export default function LogVisit() {
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (sessionStorage.getItem(VISIT_KEY)) return;
      supabase.from("page_views").insert({}).then(() => {
        try {
          sessionStorage.setItem(VISIT_KEY, "1");
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
