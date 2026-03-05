import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, carId } = await req.json();
    if (!sessionId || !carId) {
      return NextResponse.json({ error: "sessionId and carId required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || session.metadata?.user_id !== user.id || session.metadata?.car_id !== carId) {
      return NextResponse.json({ error: "Invalid or unpaid session" }, { status: 400 });
    }

    const { error } = await supabase.from("contact_unlocks").upsert(
      { buyer_id: user.id, car_id: carId, stripe_payment_id: session.payment_intent as string },
      { onConflict: "buyer_id,car_id" }
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: car } = await supabase
      .from("cars")
      .select("owner_phone, owner_whatsapp, owner_address")
      .eq("id", carId)
      .single();

    return NextResponse.json({ contact: car });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unlock failed" }, { status: 500 });
  }
}
