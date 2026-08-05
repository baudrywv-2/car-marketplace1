import { translations } from "@/lib/translations";

/** Consider online if last heartbeat was within this window. */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

export function isUserOnline(lastSeen: string | null | undefined, now = Date.now()): boolean {
  if (!lastSeen) return false;
  const ts = new Date(lastSeen).getTime();
  if (Number.isNaN(ts)) return false;
  return now - ts < ONLINE_WINDOW_MS;
}

type Translate = (key: keyof typeof translations.en) => string;

/** Short relative label for admin UIs. */
export function formatLastSeenLabel(
  lastSeen: string | null | undefined,
  t: Translate,
  now = Date.now()
): { online: boolean; label: string } {
  if (!lastSeen) return { online: false, label: t("userNeverSeen") };
  const ts = new Date(lastSeen).getTime();
  if (Number.isNaN(ts)) return { online: false, label: t("userNeverSeen") };

  if (now - ts < ONLINE_WINDOW_MS) {
    return { online: true, label: t("userOnline") };
  }

  const mins = Math.floor((now - ts) / 60_000);
  if (mins < 60) {
    return {
      online: false,
      label: t("userLastSeenMinutes").replace("{n}", String(Math.max(1, mins))),
    };
  }
  const hours = Math.floor(mins / 60);
  if (hours < 48) {
    return {
      online: false,
      label: t("userLastSeenHours").replace("{n}", String(hours)),
    };
  }
  const days = Math.floor(hours / 24);
  return {
    online: false,
    label: t("userLastSeenDays").replace("{n}", String(days)),
  };
}
