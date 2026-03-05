import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { carIds } = await req.json();
  if (!Array.isArray(carIds) || carIds.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const rows = carIds
    .filter((id: unknown) => typeof id === "string" && id.length > 0)
    .map((carId: string) => ({ user_id: user.id, car_id: carId }));

  if (rows.length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("favorites").upsert(rows, { onConflict: "user_id,car_id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

