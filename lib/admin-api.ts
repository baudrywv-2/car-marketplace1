import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function requireAdminApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return {
      error: NextResponse.json(
        { error: err instanceof Error ? err.message : "Service role not configured" },
        { status: 500 }
      ) as NextResponse,
    };
  }

  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) as NextResponse };
  }

  return { admin, user };
}

export async function notifyUser(
  admin: ReturnType<typeof createAdminClient>,
  opts: { userId: string; type: string; title: string; body?: string; carId?: string | null }
) {
  if (!opts.userId) return;
  await admin.from("user_notifications").insert({
    user_id: opts.userId,
    type: opts.type,
    car_id: opts.carId ?? null,
    title: opts.title,
    body: opts.body ?? null,
  });
}
