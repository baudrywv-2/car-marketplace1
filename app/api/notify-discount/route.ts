import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { carId, carTitle, discountPercent } = body as {
      carId: string;
      carTitle: string;
      discountPercent: number;
    };
    if (!carId || !carTitle || typeof discountPercent !== "number" || discountPercent <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("notify_favoriters_discount", {
      p_car_id: carId,
      p_car_title: carTitle,
      p_discount_percent: discountPercent,
    });

    if (error) {
      if (error.code === "P0001") return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ notified: data ?? 0 });
  } catch (e) {
    console.error("[notify-discount]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
