"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const INTERVAL_MS = 60_000;

/** Keeps profiles.last_seen fresh while a signed-in user has the app open. */
export default function PresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    async function beat() {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);
      } catch {
        /* ignore transient errors */
      }
    }

    void beat();
    const id = window.setInterval(() => void beat(), INTERVAL_MS);
    function onVis() {
      if (document.visibilityState === "visible") void beat();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
