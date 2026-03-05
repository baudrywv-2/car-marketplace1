import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const keyword = typeof body.keyword === "string" ? body.keyword.trim().slice(0, 200) : null;
    const make = typeof body.make === "string" ? body.make.trim().slice(0, 100) : null;
    const province = typeof body.province === "string" ? body.province.trim().slice(0, 100) : null;
    const minPrice = typeof body.minPrice === "number" ? body.minPrice : (typeof body.minPrice === "string" && body.minPrice) ? parseFloat(body.minPrice) : null;
    const maxPrice = typeof body.maxPrice === "number" ? body.maxPrice : (typeof body.maxPrice === "string" && body.maxPrice) ? parseFloat(body.maxPrice) : null;
    const listingType = typeof body.listingType === "string" && ["sale", "rent", "both", ""].includes(body.listingType) ? body.listingType || null : null;
    const eventType = typeof body.eventType === "string" ? body.eventType.trim().slice(0, 50) : null;

    if (!keyword && !make && !province && !minPrice && !maxPrice && !listingType && !eventType) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    await supabase.from("search_logs").insert({
      keyword: keyword || null,
      make: make || null,
      province: province || null,
      min_price: Number.isFinite(minPrice) ? minPrice : null,
      max_price: Number.isFinite(maxPrice) ? maxPrice : null,
      listing_type: listingType,
      event_type: eventType || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
