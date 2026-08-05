import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { listAuthEmailMap } from "@/lib/admin-user-emails";

/** All seller profiles for admin ops. */
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const { data: sellers, error } = await admin
      .from("profiles")
      .select(
        "id, full_name, company_name, phone, whatsapp, city, phone_verified, id_verified, dealer_verified, role, created_at, last_seen"
      )
      .eq("role", "seller")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ids = (sellers ?? []).map((s) => s.id);
    const listingCounts: Record<string, number> = {};
    if (ids.length) {
      const { data: cars } = await admin.from("cars").select("owner_id").in("owner_id", ids);
      (cars ?? []).forEach((c) => {
        if (c.owner_id) listingCounts[c.owner_id] = (listingCounts[c.owner_id] ?? 0) + 1;
      });
    }

    const emails = await listAuthEmailMap(admin);

    return NextResponse.json({
      sellers: (sellers ?? []).map((s) => ({
        ...s,
        email: emails[s.id] ?? null,
        listings_count: listingCounts[s.id] ?? 0,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      phone_verified?: boolean;
      id_verified?: boolean;
      dealer_verified?: boolean;
    };
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const patch: Record<string, boolean> = {};
    if (typeof body.phone_verified === "boolean") patch.phone_verified = body.phone_verified;
    if (typeof body.id_verified === "boolean") patch.id_verified = body.id_verified;
    if (typeof body.dealer_verified === "boolean") patch.dealer_verified = body.dealer_verified;
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "No verification fields" }, { status: 400 });
    }

    const { error } = await admin.from("profiles").update(patch).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
