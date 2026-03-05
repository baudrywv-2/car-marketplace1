"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";

type RdvRequest = {
  id: string;
  car_id: string;
  status: string;
  created_at: string;
  suggested_price: number | null;
  cars: { title: string } | null;
};

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <div className="card-premium p-4 transition hover:border-[var(--border-strong)]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

export default function BuyerDashboardPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [unlocksCount, setUnlocksCount] = useState(0);
  const [rdvRequests, setRdvRequests] = useState<RdvRequest[]>([]);
  const [adminMessages, setAdminMessages] = useState<{ id: string; subject: string; body: string; created_at: string }[]>([]);
  const [dismissedMsgIds, setDismissedMsgIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("dismissed_admin_messages");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch { return new Set(); }
  });
  const [notifications, setNotifications] = useState<{ id: string; type: string; car_id: string; title: string; body: string | null; read_at: string | null; created_at: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "meetings">("overview");

  const visibleAdminMessages = adminMessages.filter((m) => !dismissedMsgIds.has(m.id));

  function dismissAdminMessage(msgId: string) {
    const next = new Set(dismissedMsgIds);
    next.add(msgId);
    setDismissedMsgIds(next);
    try {
      localStorage.setItem("dismissed_admin_messages", JSON.stringify([...next]));
    } catch {}
  }

  async function dismissNotification(notifId: string) {
    if (!userId) return;
    await supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", notifId).eq("user_id", userId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  async function clearAllNotifications() {
    if (!userId) return;
    const unread = notifications.filter((n) => !n.read_at);
    for (const n of unread) {
      await supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id).eq("user_id", userId);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  function clearAllAdminMessages() {
    setDismissedMsgIds((prev) => {
      const ids = adminMessages.map((m) => m.id);
      const next = new Set([...prev, ...ids]);
      try {
        localStorage.setItem("dismissed_admin_messages", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/dashboard/buyer");
        return;
      }
      setUserId(user.id);

      const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profileData?.role === "admin" || profileData?.role === "seller") {
        router.replace("/dashboard");
        return;
      }

      const [
        { count: favCount },
        { count: unlockCount },
        { data: rdvData },
      ] = await Promise.all([
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("contact_unlocks").select("id", { count: "exact", head: true }).eq("buyer_id", user.id),
        supabase
          .from("rendezvous_requests")
          .select("id, car_id, status, created_at, suggested_price, cars(title)")
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setFavoritesCount(favCount ?? 0);
      setUnlocksCount(unlockCount ?? 0);
      setRdvRequests((rdvData as unknown as RdvRequest[]) ?? []);

      const { data: msgData } = await supabase
        .from("admin_messages")
        .select("id, subject, body, created_at")
        .eq("target_audience", "buyers")
        .order("created_at", { ascending: false })
        .limit(5);
      setAdminMessages((msgData ?? []) as { id: string; subject: string; body: string; created_at: string }[]);

      const { data: notifData } = await supabase
        .from("user_notifications")
        .select("id, type, car_id, title, body, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications((notifData ?? []) as { id: string; type: string; car_id: string; title: string; body: string | null; read_at: string | null; created_at: string }[]);

      setLoading(false);
    }
    load();
  }, [router]);

  async function cancelRdv(rdvId: string) {
    if (!confirm("Cancel this meeting request? The seller will no longer see it.")) return;
    await supabase.from("rendezvous_requests").delete().eq("id", rdvId);
    setRdvRequests((prev) => prev.filter((r) => r.id !== rdvId));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-heading text-[var(--foreground)]">My account</h1>
        <Link href="/dashboard" className="text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          ← {t("backToDashboard")}
        </Link>
      </div>

      <div className="mb-6 border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 px-1 py-3 text-caption font-medium transition-colors ${
              activeTab === "overview"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            {t("tabOverview")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("meetings")}
            className={`border-b-2 px-1 py-3 text-caption font-medium transition-colors ${
              activeTab === "meetings"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            {t("tabMeetingRequests")}
          </button>
        </nav>
      </div>

      {activeTab === "overview" && (
        <>
      {notifications.length > 0 && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Notifications</h2>
            {notifications.some((n) => !n.read_at) && (
              <button type="button" onClick={clearAllNotifications} className="text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Clear all</button>
            )}
          </div>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={`flex items-start justify-between gap-2 rounded-[var(--radius)] border p-3 ${n.read_at ? "border-[var(--border)] bg-[var(--background)] opacity-75" : "border-[var(--accent)]/30 bg-[var(--accent)]/5"}`}>
                <div>
                  <Link href={`/cars/${n.car_id}`} className="font-semibold text-[var(--foreground)] hover:underline">
                    {n.title}
                  </Link>
                  {n.body && <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => dismissNotification(n.id)} className="shrink-0 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Dismiss</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {visibleAdminMessages.length > 0 && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Messages from admin</h2>
            <button
              type="button"
              onClick={clearAllAdminMessages}
              className="text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-3">
            {visibleAdminMessages.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--foreground)]">{m.subject}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[11px] text-[var(--muted-foreground)]">{m.body}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissAdminMessage(m.id)}
                  className="shrink-0 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label={t("myFavorites")} value={favoritesCount} href="/favorites" />
        <StatCard label="Contact unlocks" value={unlocksCount} />
        <StatCard label="Meeting requests" value={rdvRequests.length} />
      </div>

      <div className="mb-6">
        <h2 className="text-body mb-3 font-semibold text-[var(--foreground)]">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/cars" className="btn-primary">{t("browseCars")}</Link>
          <Link href="/favorites" className="btn-secondary">{t("myFavorites")}</Link>
          <Link href="/compare" className="btn-secondary">{t("compare")}</Link>
        </div>
      </div>
        </>
      )}

      {activeTab === "meetings" && rdvRequests.length > 0 && (
        <div>
          <h2 className="text-body mb-3 font-semibold text-[var(--foreground)]">Your meeting requests</h2>
          <p className="text-caption mb-4 text-[var(--muted-foreground)]">
            Status of your rendez-vous requests. Admin will process and connect you with the seller.
          </p>
          <ul className="space-y-3">
            {rdvRequests.map((rdv) => {
              const title = (rdv.cars && typeof rdv.cars === "object" && "title" in rdv.cars) ? (rdv.cars as { title: string }).title : "Car";
              return (
                <li key={rdv.id} className="card-compact flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <Link href={`/cars/${rdv.car_id}`} className="font-medium text-[var(--foreground)] hover:underline">
                      {title}
                    </Link>
                    <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {new Date(rdv.created_at).toLocaleDateString()}
                    </p>
                    {rdv.suggested_price != null && rdv.suggested_price > 0 && (
                      <p className="mt-0.5 text-[10px] font-medium text-[var(--foreground)]">
                        Your offer: {Number(rdv.suggested_price).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] ${
                        rdv.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {rdv.status === "pending" ? "Pending" : "Approved"}
                    </span>
                    <button
                      type="button"
                      onClick={() => cancelRdv(rdv.id)}
                      className="rounded border border-red-300 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Cancel request
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activeTab === "meetings" && rdvRequests.length === 0 && (
        <div className="card-premium flex flex-col items-center justify-center gap-2 p-12 text-center">
          <p className="text-body text-[var(--muted-foreground)]">
            You haven&apos;t requested any meetings yet. Browse cars and click &quot;Request meeting&quot; on a listing.
          </p>
          <Link href="/cars" className="btn-primary mt-2">{t("browseCars")}</Link>
        </div>
      )}
    </div>
  );
}
