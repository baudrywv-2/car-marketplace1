import { NextResponse } from "next/server";
import { notifyUser, requireAdminApi } from "@/lib/admin-api";

/** All listings for admins (service role). */
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const { data: cars, error } = await admin
      .from("cars")
      .select(
        "id, title, price, make, model, year, is_approved, is_draft, is_sold, boost_score, rejection_reason, owner_id, owner_phone, owner_whatsapp, owner_address, listing_type, images, created_at, currency"
      )
      .order("boost_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const carsList = cars ?? [];
    const ownerIds = [...new Set(carsList.map((c) => c.owner_id).filter(Boolean))];
    const profiles: Record<string, unknown> = {};

    if (ownerIds.length > 0) {
      const { data: profData } = await admin
        .from("profiles")
        .select("id, full_name, company_name, phone, whatsapp, phone_verified, id_verified, dealer_verified, city")
        .in("id", ownerIds);
      (profData ?? []).forEach((p) => {
        profiles[p.id] = p;
      });
    }

    return NextResponse.json({ cars: carsList, profiles });
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
      ids?: string[];
      action?: "approve" | "reject" | "boost" | "sold" | "bulk_approve";
      rejection_reason?: string | null;
      boost_score?: number;
      is_sold?: boolean;
    };

    if (body.action === "bulk_approve") {
      const ids = (body.ids ?? []).filter(Boolean);
      if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

      const { data: rows, error: fetchErr } = await admin
        .from("cars")
        .select("id, title, owner_id")
        .in("id", ids);
      if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

      const { error } = await admin
        .from("cars")
        .update({ is_approved: true, is_draft: false, rejection_reason: null })
        .in("id", ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      for (const row of rows ?? []) {
        if (row.owner_id) {
          await notifyUser(admin, {
            userId: row.owner_id,
            type: "listing_approved",
            carId: row.id,
            title: "Annonce approuvée",
            body: `« ${row.title} » est maintenant en ligne sur DRCCARS.`,
          });
        }
      }
      return NextResponse.json({ ok: true, count: ids.length });
    }

    if (!body.id || !body.action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }

    const { data: existing, error: existErr } = await admin
      .from("cars")
      .select("id, title, owner_id")
      .eq("id", body.id)
      .maybeSingle();
    if (existErr) return NextResponse.json({ error: existErr.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    let patch: Record<string, unknown> = {};
    if (body.action === "approve") {
      patch = { is_approved: true, is_draft: false, rejection_reason: null };
    } else if (body.action === "reject") {
      patch = { is_approved: false, rejection_reason: body.rejection_reason?.trim() || null };
    } else if (body.action === "boost") {
      const score = Number(body.boost_score);
      if (!Number.isFinite(score) || score < 0 || score > 5) {
        return NextResponse.json({ error: "boost_score must be 0–5" }, { status: 400 });
      }
      patch = { boost_score: score };
    } else if (body.action === "sold") {
      patch = { is_sold: !!body.is_sold };
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const { error } = await admin.from("cars").update(patch).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (existing.owner_id && (body.action === "approve" || body.action === "reject")) {
      if (body.action === "approve") {
        await notifyUser(admin, {
          userId: existing.owner_id,
          type: "listing_approved",
          carId: existing.id,
          title: "Annonce approuvée",
          body: `« ${existing.title} » est maintenant en ligne sur DRCCARS.`,
        });
      } else {
        const reason = body.rejection_reason?.trim();
        await notifyUser(admin, {
          userId: existing.owner_id,
          type: "listing_rejected",
          carId: existing.id,
          title: "Annonce refusée",
          body: reason
            ? `« ${existing.title} » a été refusée. Motif : ${reason}`
            : `« ${existing.title} » a été refusée. Corrigez et renvoyez.`,
        });
      }
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

    const { data: existing } = await admin.from("cars").select("id, title, owner_id").eq("id", id).maybeSingle();
    const { error } = await admin.from("cars").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (existing?.owner_id) {
      await notifyUser(admin, {
        userId: existing.owner_id,
        type: "listing_deleted",
        carId: null,
        title: "Annonce supprimée",
        body: `« ${existing.title} » a été retirée par l’admin DRCCARS.`,
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
