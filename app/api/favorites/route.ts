import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ carIds: [] });
  }
  const { data, error } = await supabase
    .from("favorites")
    .select("car_id")
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const carIds = (data ?? []).map((r) => r.car_id);
  return NextResponse.json({ carIds });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { carId } = await req.json();
  if (!carId) {
    return NextResponse.json({ error: "carId required" }, { status: 400 });
  }
  const { error } = await supabase.from("favorites").upsert(
    { user_id: user.id, car_id: carId },
    { onConflict: "user_id,car_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("carId") ?? (await req.json().catch(() => ({}))).carId;
  if (!carId) {
    return NextResponse.json({ error: "carId required" }, { status: 400 });
  }
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("car_id", carId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
