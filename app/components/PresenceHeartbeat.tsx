"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const INTERVAL_MS = 180_000;
const FIRST_BEAT_DELAY_MS = 12_000;

/** Keeps profiles.last_seen fresh while a signed-in user has the app open (low priority). */
export default function PresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;
    let userId: string | null = null;
    let intervalId = 0;
    let startTimer = 0;

    async function resolveUser() {
      if (userId) return userId;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      return userId;
    }

    async function beat() {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        const id = await resolveUser();
        if (!id || cancelled) return;
        await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", id);
      } catch {
        /* ignore */
      }
    }

    startTimer = window.setTimeout(() => {
      void beat();
      intervalId = window.setInterval(() => void beat(), INTERVAL_MS);
    }, FIRST_BEAT_DELAY_MS);

    function onVis() {
      if (document.visibilityState === "visible") void beat();
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
