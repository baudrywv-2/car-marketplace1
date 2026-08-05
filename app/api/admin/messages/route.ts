import { NextResponse } from "next/server";
import { notifyUser, requireAdminApi } from "@/lib/admin-api";
import { listAuthEmailMap } from "@/lib/admin-user-emails";

export type AdminMessageRow = {
  id: string;
  target_audience: "sellers" | "buyers" | "user";
  subject: string;
  body: string;
  status: "draft" | "sent" | "archived";
  recipient_user_id: string | null;
  created_at: string;
  updated_at: string | null;
  archived_at: string | null;
  created_by: string | null;
};

const MSG_SELECT =
  "id, target_audience, subject, body, status, recipient_user_id, created_at, updated_at, archived_at, created_by";

/** List messages + optional recipient directory for the picker. */
export async function GET(req: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const wantRecipients = searchParams.get("recipients") === "1";

    let query = admin.from("admin_messages").select(MSG_SELECT).order("created_at", { ascending: false });

    if (status === "draft" || status === "sent" || status === "archived") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let recipients: {
      id: string;
      full_name: string | null;
      company_name: string | null;
      role: string | null;
      city: string | null;
      last_seen: string | null;
      email: string | null;
    }[] = [];

    if (wantRecipients) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, company_name, role, city, last_seen")
        .order("created_at", { ascending: false })
        .limit(400);
      const emails = await listAuthEmailMap(admin);
      recipients = (profiles ?? []).map((p) => ({
        ...p,
        last_seen: p.last_seen ?? null,
        email: emails[p.id] ?? null,
      }));
    }

    return NextResponse.json({ messages: data ?? [], recipients });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

/** Create draft or send message. */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin, user } = auth;

    const body = (await req.json().catch(() => ({}))) as {
      action?: "send" | "draft";
      target?: "sellers" | "buyers" | "user";
      recipientUserId?: string;
      subject?: string;
      body?: string;
    };

    const action = body.action === "draft" ? "draft" : "send";
    const target = body.target === "buyers" || body.target === "user" ? body.target : "sellers";
    const subject = (body.subject ?? "").trim();
    const text = (body.body ?? "").trim();

    if (!subject || !text) {
      return NextResponse.json({ error: "subject and body required" }, { status: 400 });
    }
    if (target === "user" && !body.recipientUserId) {
      return NextResponse.json({ error: "recipientUserId required for single user" }, { status: 400 });
    }

    const row = {
      target_audience: target,
      subject,
      body: text,
      status: action === "draft" ? "draft" : "sent",
      recipient_user_id: target === "user" ? body.recipientUserId! : null,
      created_by: user.id,
      updated_at: new Date().toISOString(),
      archived_at: null as string | null,
    };

    const { data, error } = await admin.from("admin_messages").insert(row).select(MSG_SELECT).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (action === "send" && target === "user" && body.recipientUserId) {
      await notifyUser(admin, {
        userId: body.recipientUserId,
        type: "admin_message",
        title: subject,
        body: text.slice(0, 280),
      });
    }

    return NextResponse.json({ message: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

/** Update draft, publish, archive, or soft-delete to archived. */
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      action?: "archive" | "unarchive" | "publish" | "update";
      subject?: string;
      body?: string;
      target?: "sellers" | "buyers" | "user";
      recipientUserId?: string;
    };

    if (!body.id || !body.action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }

    const { data: existing, error: fetchErr } = await admin
      .from("admin_messages")
      .select(MSG_SELECT)
      .eq("id", body.id)
      .maybeSingle();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const now = new Date().toISOString();
    let patch: Record<string, unknown> = { updated_at: now };

    if (body.action === "archive") {
      patch = { ...patch, status: "archived", archived_at: now };
    } else if (body.action === "unarchive") {
      patch = { ...patch, status: "sent", archived_at: null };
    } else if (body.action === "publish") {
      if (existing.status !== "draft") {
        return NextResponse.json({ error: "Only drafts can be published" }, { status: 400 });
      }
      patch = { ...patch, status: "sent", archived_at: null };
      if (existing.target_audience === "user" && existing.recipient_user_id) {
        await notifyUser(admin, {
          userId: existing.recipient_user_id,
          type: "admin_message",
          title: existing.subject,
          body: (existing.body ?? "").slice(0, 280),
        });
      }
    } else if (body.action === "update") {
      if (existing.status !== "draft") {
        return NextResponse.json({ error: "Only drafts can be edited" }, { status: 400 });
      }
      const subject = (body.subject ?? existing.subject).trim();
      const text = (body.body ?? existing.body).trim();
      if (!subject || !text) {
        return NextResponse.json({ error: "subject and body required" }, { status: 400 });
      }
      const target =
        body.target === "buyers" || body.target === "user" || body.target === "sellers"
          ? body.target
          : existing.target_audience;
      if (target === "user" && !(body.recipientUserId || existing.recipient_user_id)) {
        return NextResponse.json({ error: "recipientUserId required" }, { status: 400 });
      }
      patch = {
        ...patch,
        subject,
        body: text,
        target_audience: target,
        recipient_user_id: target === "user" ? body.recipientUserId || existing.recipient_user_id : null,
      };
    }

    const { data, error } = await admin
      .from("admin_messages")
      .update(patch)
      .eq("id", body.id)
      .select(MSG_SELECT)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

/** Hard delete. */
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;
    const { admin } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await admin.from("admin_messages").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
