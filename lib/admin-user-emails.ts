import type { SupabaseClient } from "@supabase/supabase-js";

/** Build id → email map from Auth (service role). */
export async function listAuthEmailMap(admin: SupabaseClient): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    for (const u of data.users) {
      if (u.email) map[u.id] = u.email;
    }
    if (data.users.length < 200) break;
    page += 1;
    if (page > 25) break;
  }
  return map;
}
