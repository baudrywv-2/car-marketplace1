const GUEST_KEY = "guest-favorites";

export function readGuestFavorites(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

export function writeGuestFavorites(ids: string[]): void {
  try {
    const unique = Array.from(new Set(ids));
    localStorage.setItem(GUEST_KEY, JSON.stringify(unique));
  } catch {
    /* ignore */
  }
}

export const GUEST_FAVORITES_KEY = GUEST_KEY;
