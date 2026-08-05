import { NextResponse } from "next/server";
import { notifyUser, requireAdminApi } from "@/lib/admin-api";

/** Fetches all RDV for admins using service role (bypasses RLS). */
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const { data: rdvData, error } = await admin
      .from("rendezvous_requests")
      .select(
        `
        id, car_id, intent, message, preferred_date, suggested_price, status, created_at,
        buyer_email, buyer_name, buyer_phone, buyer_id,
        cars(title, listing_type, owner_id, owner_phone, owner_whatsapp, owner_address)
      `
      )
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(rdvData ?? []);
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

    const body = (await req.json().catch(() => ({}))) as { id?: string; action?: "approve" };
    if (!body.id || body.action !== "approve") {
      return NextResponse.json({ error: "id and action=approve required" }, { status: 400 });
    }

    const { data: rdv, error: fetchErr } = await admin
      .from("rendezvous_requests")
      .select("id, car_id, buyer_id, buyer_name, buyer_email, cars(title, owner_id)")
      .eq("id", body.id)
      .maybeSingle();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!rdv) return NextResponse.json({ error: "RDV not found" }, { status: 404 });

    const { error } = await admin.from("rendezvous_requests").update({ status: "approved" }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const carRel = rdv.cars as { title?: string; owner_id?: string } | { title?: string; owner_id?: string }[] | null;
    const car = Array.isArray(carRel) ? carRel[0] : carRel;
    const title = car?.title ?? "véhicule";
    if (car?.owner_id) {
      await notifyUser(admin, {
        userId: car.owner_id,
        type: "rdv_approved",
        carId: rdv.car_id,
        title: "Nouveau rendez-vous approuvé",
        body: `Un acheteur (${rdv.buyer_name || rdv.buyer_email || "—"}) pour « ${title} ». Voir l’onglet Rendez-vous.`,
      });
    }
    if (rdv.buyer_id) {
      await notifyUser(admin, {
        userId: rdv.buyer_id,
        type: "rdv_approved",
        carId: rdv.car_id,
        title: "Votre rendez-vous est approuvé",
        body: `Votre demande pour « ${title} » a été approuvée. Le vendeur va vous contacter.`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await admin.from("rendezvous_requests").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
