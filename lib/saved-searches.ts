import type { SavedSearchData } from "@/lib/car-search-query";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SAVED_SEARCHES_KEY = "saved-searches";
export const MAX_SAVED_SEARCHES = 10;

export type SavedSearchEntry = {
  id: string;
  label: string;
  data: SavedSearchData;
};

export function readLocalSavedSearches(): SavedSearchEntry[] {
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s: unknown) =>
        s &&
        typeof s === "object" &&
        typeof (s as SavedSearchEntry).id === "string" &&
        typeof (s as SavedSearchEntry).label === "string" &&
        typeof (s as SavedSearchEntry).data === "object"
    ) as SavedSearchEntry[];
  } catch {
    return [];
  }
}

export function writeLocalSavedSearches(entries: SavedSearchEntry[]) {
  try {
    localStorage.setItem(
      SAVED_SEARCHES_KEY,
      JSON.stringify(entries.slice(0, MAX_SAVED_SEARCHES))
    );
  } catch {
    // ignore
  }
}

function mergeById(local: SavedSearchEntry[], cloud: SavedSearchEntry[]): SavedSearchEntry[] {
  const map = new Map<string, SavedSearchEntry>();
  [...cloud, ...local].forEach((e) => map.set(e.id, e));
  return Array.from(map.values())
    .sort((a, b) => (b.id > a.id ? 1 : -1))
    .slice(0, MAX_SAVED_SEARCHES);
}

export async function loadSavedSearches(
  supabase: SupabaseClient,
  userId: string | null
): Promise<SavedSearchEntry[]> {
  const local = readLocalSavedSearches();
  if (!userId) return local;

  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, label, query, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_SAVED_SEARCHES);

  if (error || !data) return local;

  const cloud: SavedSearchEntry[] = data.map((row) => ({
    id: row.id as string,
    label: row.label as string,
    data: (row.query ?? {}) as SavedSearchData,
  }));

  const merged = mergeById(local, cloud);
  writeLocalSavedSearches(merged);
  return merged;
}

export async function persistSavedSearch(
  supabase: SupabaseClient,
  userId: string | null,
  entry: SavedSearchEntry,
  previous: SavedSearchEntry[]
): Promise<SavedSearchEntry[]> {
  const updated = [entry, ...previous.filter((s) => s.id !== entry.id)].slice(
    0,
    MAX_SAVED_SEARCHES
  );
  writeLocalSavedSearches(updated);

  if (userId) {
    await supabase.from("saved_searches").upsert({
      id: entry.id,
      user_id: userId,
      label: entry.label,
      query: entry.data,
    });
  }

  return updated;
}

export async function removeSavedSearch(
  supabase: SupabaseClient,
  userId: string | null,
  id: string,
  previous: SavedSearchEntry[]
): Promise<SavedSearchEntry[]> {
  const updated = previous.filter((s) => s.id !== id);
  writeLocalSavedSearches(updated);
  if (userId) {
    await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", userId);
  }
  return updated;
}
