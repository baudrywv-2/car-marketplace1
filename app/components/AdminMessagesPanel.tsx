"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useToast } from "@/app/contexts/ToastContext";
import EmptyState from "@/app/components/EmptyState";

type MsgStatus = "draft" | "sent" | "archived";
type MsgTarget = "sellers" | "buyers" | "user";

type AdminMsg = {
  id: string;
  target_audience: MsgTarget;
  subject: string;
  body: string;
  status: MsgStatus;
  recipient_user_id: string | null;
  created_at: string;
  updated_at?: string | null;
  archived_at?: string | null;
};

type Recipient = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: string | null;
  city: string | null;
};

type ListFilter = "all" | "sent" | "draft" | "archived";

function recipientLabel(r: Recipient) {
  return r.company_name || r.full_name || r.id.slice(0, 8);
}

export default function AdminMessagesPanel() {
  const { t } = useLocale();
  const toast = useToast();
  const [messages, setMessages] = useState<AdminMsg[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [target, setTarget] = useState<MsgTarget>("sellers");
  const [recipientId, setRecipientId] = useState("");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages?recipients=1", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string }).error || t("adminFailedSendMessage"));
        return;
      }
      setMessages(((json as { messages?: AdminMsg[] }).messages ?? []) as AdminMsg[]);
      setRecipients(((json as { recipients?: Recipient[] }).recipients ?? []) as Recipient[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminNetworkError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRecipients = useMemo(() => {
    const q = recipientQuery.trim().toLowerCase();
    const list = recipients.filter((r) => r.role !== "admin");
    if (!q) return list.slice(0, 40);
    return list
      .filter((r) => {
        const hay = `${r.full_name ?? ""} ${r.company_name ?? ""} ${r.city ?? ""} ${r.role ?? ""}`.toLowerCase();
        return hay.includes(q) || r.id.toLowerCase().includes(q);
      })
      .slice(0, 40);
  }, [recipients, recipientQuery]);

  const visibleMessages = useMemo(() => {
    if (listFilter === "all") return messages;
    return messages.filter((m) => m.status === listFilter);
  }, [messages, listFilter]);

  const counts = useMemo(
    () => ({
      all: messages.length,
      sent: messages.filter((m) => m.status === "sent").length,
      draft: messages.filter((m) => m.status === "draft").length,
      archived: messages.filter((m) => m.status === "archived").length,
    }),
    [messages]
  );

  function resetForm() {
    setEditingId(null);
    setTarget("sellers");
    setRecipientId("");
    setRecipientQuery("");
    setSubject("");
    setBody("");
  }

  function loadDraftIntoForm(m: AdminMsg) {
    setEditingId(m.id);
    setTarget(m.target_audience);
    setRecipientId(m.recipient_user_id ?? "");
    setSubject(m.subject);
    setBody(m.body);
    const r = recipients.find((x) => x.id === m.recipient_user_id);
    setRecipientQuery(r ? recipientLabel(r) : "");
  }

  function audienceLabel(m: AdminMsg) {
    if (m.target_audience === "sellers") return t("adminAllSellers");
    if (m.target_audience === "buyers") return t("adminAllBuyers");
    const r = recipients.find((x) => x.id === m.recipient_user_id);
    return r ? `${t("adminOneUser")}: ${recipientLabel(r)}` : t("adminOneUser");
  }

  async function save(action: "send" | "draft") {
    if (!subject.trim() || !body.trim()) return;
    if (target === "user" && !recipientId) {
      setError(t("adminPickUser"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        const upd = await fetch("/api/admin/messages", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            action: "update",
            subject: subject.trim(),
            body: body.trim(),
            target,
            recipientUserId: target === "user" ? recipientId : undefined,
          }),
        });
        const updJson = await upd.json().catch(() => ({}));
        if (!upd.ok) {
          setError((updJson as { error?: string }).error || t("adminFailedSendMessage"));
          return;
        }
        if (action === "send") {
          const pub = await fetch("/api/admin/messages", {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, action: "publish" }),
          });
          const pubJson = await pub.json().catch(() => ({}));
          if (!pub.ok) {
            setError((pubJson as { error?: string }).error || t("adminFailedSendMessage"));
            return;
          }
        }
        toast.success(action === "send" ? t("adminMessageSent") : t("adminDraftSaved"));
      } else {
        const res = await fetch("/api/admin/messages", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            target,
            recipientUserId: target === "user" ? recipientId : undefined,
            subject: subject.trim(),
            body: body.trim(),
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((json as { error?: string }).error || t("adminFailedSendMessage"));
          return;
        }
        toast.success(action === "send" ? t("adminMessageSent") : t("adminDraftSaved"));
      }
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patchMessage(id: string, action: "archive" | "unarchive" | "publish") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error || t("adminActionFailed"));
        return;
      }
      toast.success(
        action === "archive"
          ? t("adminMessageArchived")
          : action === "unarchive"
            ? t("adminMessageRestored")
            : t("adminMessageSent")
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm(t("adminDeleteMessageConfirm"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/messages?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error || t("adminActionFailed"));
        return;
      }
      toast.success(t("adminMessageDeleted"));
      if (editingId === id) resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-caption text-[var(--muted-foreground)]">{t("adminMessagesHelp")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save("send");
        }}
        className="overflow-hidden rounded-xl border border-[var(--accent)]/30 bg-[var(--card)]"
      >
        <div className="border-b border-[var(--border)] bg-black/40 px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {editingId ? t("adminEditDraft") : t("adminComposeMessage")}
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{t("adminMessagesPlatformOnly")}</p>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">{t("adminMessageTo")}</label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["sellers", t("adminAllSellers")],
                  ["buyers", t("adminAllBuyers")],
                  ["user", t("adminOneUser")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTarget(value)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    target === value
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {target === "user" && (
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">{t("adminPickUser")}</label>
              <input
                type="search"
                value={recipientQuery}
                onChange={(e) => {
                  setRecipientQuery(e.target.value);
                  setRecipientId("");
                }}
                placeholder={t("adminSearchUserPlaceholder")}
                className="input-premium mb-2 w-full"
              />
              <div className="max-h-40 overflow-auto rounded-lg border border-[var(--border)]">
                {filteredRecipients.length === 0 ? (
                  <p className="p-3 text-[11px] text-[var(--muted-foreground)]">{t("adminNoUsersFound")}</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {filteredRecipients.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientId(r.id);
                            setRecipientQuery(recipientLabel(r));
                          }}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition hover:bg-[var(--border)]/40 ${
                            recipientId === r.id ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--foreground)]"
                          }`}
                        >
                          <span className="min-w-0 truncate font-medium">{recipientLabel(r)}</span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                            {r.role || "user"}
                            {r.city ? ` · ${r.city}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">{t("adminSubject")}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("adminSubjectPlaceholder")}
              className="input-premium w-full"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">{t("adminMessageBody")}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("adminMessagePlaceholder")}
              className="input-premium min-h-[140px] w-full"
              rows={5}
              required
            />
          </div>

          {error && <p className="text-[11px] text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="btn-primary min-h-10 disabled:opacity-50">
              {busy ? t("sending") : t("adminSendMessage")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save("draft")}
              className="btn-secondary min-h-10 disabled:opacity-50"
            >
              {t("adminSaveDraft")}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost min-h-10 text-[12px]">
                {t("cancel")}
              </button>
            )}
          </div>
        </div>
      </form>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {t("adminSentMessages")}
          </h3>
          <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5">
            {(
              [
                ["all", t("adminMsgFilterAll"), counts.all],
                ["sent", t("adminMsgFilterSent"), counts.sent],
                ["draft", t("adminMsgFilterDrafts"), counts.draft],
                ["archived", t("adminMsgFilterArchived"), counts.archived],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setListFilter(id)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                  listFilter === id
                    ? "bg-[var(--border)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-caption text-[var(--muted-foreground)]">{t("loading")}</p>
        ) : visibleMessages.length === 0 ? (
          <EmptyState title={t("adminNoMessages")} />
        ) : (
          <ul className="space-y-3">
            {visibleMessages.map((m) => (
              <li
                key={m.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]/35"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        m.status === "draft"
                          ? "bg-amber-500/15 text-amber-400"
                          : m.status === "archived"
                            ? "bg-white/10 text-white/50"
                            : "bg-[var(--accent)]/15 text-[var(--accent)]"
                      }`}
                    >
                      {m.status === "draft"
                        ? t("adminMsgStatusDraft")
                        : m.status === "archived"
                          ? t("adminMsgStatusArchived")
                          : t("adminMsgStatusSent")}
                    </span>
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {audienceLabel(m)}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {new Date(m.updated_at || m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.status === "draft" && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => loadDraftIntoForm(m)}
                          className="rounded border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--foreground)] hover:border-[var(--accent)]"
                        >
                          {t("edit")}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void patchMessage(m.id, "publish")}
                          className="rounded border border-[var(--accent)]/40 px-2 py-1 text-[10px] font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
                        >
                          {t("adminSendMessage")}
                        </button>
                      </>
                    )}
                    {m.status === "sent" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchMessage(m.id, "archive")}
                        className="rounded border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {t("adminArchive")}
                      </button>
                    )}
                    {m.status === "archived" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patchMessage(m.id, "unarchive")}
                        className="rounded border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {t("adminUnarchive")}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteMessage(m.id)}
                      className="rounded border border-red-500/40 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/10"
                    >
                      {t("adminRemove")}
                    </button>
                  </div>
                </div>
                <p className="font-semibold text-[var(--foreground)]">{m.subject}</p>
                <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--muted-foreground)]">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
