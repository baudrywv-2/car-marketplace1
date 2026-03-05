import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const UNLOCK_PRICE_CENTS = Number(process.env.UNLOCK_PRICE_CENTS) || 500; // $5 default

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { carId } = await req.json();
    if (!carId || typeof carId !== "string") {
      return NextResponse.json({ error: "carId required" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: "Unlock seller contact",
              description: "One-time fee to view seller phone, WhatsApp, and address for this listing.",
            },
            unit_amount: UNLOCK_PRICE_CENTS,
          },
        },
      ],
      metadata: { user_id: user.id, car_id: carId },
      success_url: `${origin}/cars/${carId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cars/${carId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
