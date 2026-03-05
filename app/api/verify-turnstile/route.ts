import { NextResponse } from "next/server";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(req: Request) {
  const { token } = (await req.json()) as { token?: string };
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not set – skipping CAPTCHA verification");
    return NextResponse.json({ success: true });
  }

  if (!token) {
    return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data["error-codes"]?.join(", ") ?? "Verification failed" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Turnstile verify error:", e);
    return NextResponse.json({ success: false, error: "Verification error" }, { status: 500 });
  }
}
