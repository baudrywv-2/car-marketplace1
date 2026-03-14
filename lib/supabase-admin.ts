import { createClient } from "@supabase/supabase-js";

/** Server-side only. Uses service role key to bypass RLS. Required for admin RDV. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY required for admin. Add it to .env.local (Supabase Dashboard → Settings → API → service_role).");
  }
  return createClient(url, serviceKey);
}
