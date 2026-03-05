import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Payment not configured. Contact unlock is disabled." },
    { status: 501 }
  );
}
