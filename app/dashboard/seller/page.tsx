"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { SUPPORT_EMAIL, SITE_URL } from "@/lib/constants";
import { formatPrice } from "@/lib/format-utils";

type Profile = { id: string; full_name: string | null; role: string; company_name: string | null; phone?: string | null; whatsapp?: string | null };
type Car = {
  id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number | null;
  is_approved: boolean;
  is_draft?: boolean;
  is_sold?: boolean;
  rejection_reason?: string | null;
  created_at: string;
};

type ApprovedRdv = { id: string; car_id: string; created_at: string; suggested_price: number | null; cars: { title: string } | null };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-premium p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function isVerified(user: { email_confirmed_at?: string | null } | null): boolean {
  return !!user?.email_confirmed_at;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<{ email_confirmed_at?: string | null } | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [approvedRdv, setApprovedRdv] = useState<ApprovedRdv[]>([]);
  const [stats, setStats] = useState<Record<string, { views: number; favorites: number; unlocks: number; rdv: number }>>({});
  const [adminMessages, setAdminMessages] = useState<{ id: string; subject: string; body: string; created_at: string }[]>([]);
  const [dismissedMsgIds, setDismissedMsgIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("dismissed_admin_messages");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch { return new Set(); }
  });
  const [dismissedRdvIds, setDismissedRdvIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("dismissed_seller_rdv");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch { return new Set(); }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "rdv">("overview");

  const visibleAdminMessages = adminMessages.filter((m) => !dismissedMsgIds.has(m.id));
  const visibleApprovedRdv = approvedRdv.filter((r) => !dismissedRdvIds.has(r.id));

  function dismissAdminMessage(msgId: string) {
    setDismissedMsgIds((prev) => {
      const next = new Set(prev);
      next.add(msgId);
      try { localStorage.setItem("dismissed_admin_messages", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function clearAllAdminMessages() {
    setDismissedMsgIds((prev) => {
      const next = new Set([...prev, ...adminMessages.map((m) => m.id)]);
      try { localStorage.setItem("dismissed_admin_messages", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function dismissRdv(rdvId: string) {
    setDismissedRdvIds((prev) => {
      const next = new Set(prev);
      next.add(rdvId);
      try { localStorage.setItem("dismissed_seller_rdv", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function clearAllRdv() {
    setDismissedRdvIds((prev) => {
      const next = new Set([...prev, ...approvedRdv.map((r) => r.id)]);
      try { localStorage.setItem("dismissed_seller_rdv", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login?next=/dashboard/seller");
        return;
      }
      setUser(u);

      let { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, role, company_name, phone, whatsapp")
        .eq("id", u.id)
        .single();
      if (!profileData) {
        const { data: inserted } = await supabase
          .from("profiles")
          .upsert({ id: u.id, full_name: u.email ?? "User", role: "seller" }, { onConflict: "id" })
          .select("id, full_name, role, company_name, phone, whatsapp")
          .single();
        profileData = inserted;
      }
      setProfile(profileData ?? { id: u.id, full_name: u.email ?? "User", role: "seller", company_name: null, phone: null, whatsapp: null });

      if (profileData?.role !== "seller" && profileData?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      const { data: carsData } = await supabase
        .from("cars")
        .select("id, title, price, make, model, year, is_approved, is_draft, is_sold, rejection_reason, created_at")
        .eq("owner_id", u.id)
        .order("created_at", { ascending: false });
      const list = (carsData as Car[]) ?? [];
      setCars(list);

      const { data: rdvData } = await supabase
        .from("rendezvous_requests")
        .select("id, car_id, created_at, suggested_price, cars(title)")
        .eq("status", "approved")
        .in("car_id", list.map((c) => c.id))
        .order("created_at", { ascending: false });
      setApprovedRdv((rdvData as unknown as ApprovedRdv[]) ?? []);

      if (list.length > 0) {
        const ids = list.map((c) => c.id);
        const [{ data: viewsData }, { data: favData }, { data: unlockData }, { data: rdvDataAll }] = await Promise.all([
          supabase.from("car_views").select("car_id").in("car_id", ids),
          supabase.from("favorites").select("car_id").in("car_id", ids),
          supabase.from("contact_unlocks").select("car_id").in("car_id", ids),
          supabase.from("rendezvous_requests").select("car_id").eq("status", "approved").in("car_id", ids),
        ]);
        const byCar: Record<string, { views: number; favorites: number; unlocks: number; rdv: number }> = {};
        ids.forEach((id) => { byCar[id] = { views: 0, favorites: 0, unlocks: 0, rdv: 0 }; });
        (viewsData ?? []).forEach((r: { car_id?: string }) => { if (r.car_id && byCar[r.car_id]) byCar[r.car_id].views++; });
        (favData ?? []).forEach((r: { car_id?: string }) => { if (r.car_id && byCar[r.car_id]) byCar[r.car_id].favorites++; });
        (unlockData ?? []).forEach((r: { car_id?: string }) => { if (r.car_id && byCar[r.car_id]) byCar[r.car_id].unlocks++; });
        (rdvDataAll ?? []).forEach((r: { car_id?: string }) => { if (r.car_id && byCar[r.car_id]) byCar[r.car_id].rdv++; });
        setStats(byCar);
      }

      const { data: msgData } = await supabase
        .from("admin_messages")
        .select("id, subject, body, created_at")
        .eq("target_audience", "sellers")
        .order("created_at", { ascending: false })
        .limit(5);
      setAdminMessages((msgData ?? []) as { id: string; subject: string; body: string; created_at: string }[]);

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleDelete(carId: string) {
    if (!confirm(t("deleteListingConfirm"))) return;
    await supabase.from("cars").delete().eq("id", carId);
    setCars((prev) => prev.filter((c) => c.id !== carId));
  }

  async function handleMarkAsSold(carId: string) {
    if (!confirm(t("markAsSoldConfirm"))) return;
    await supabase.from("cars").update({ is_sold: true }).eq("id", carId);
    setCars((prev) => prev.map((c) => (c.id === carId ? { ...c, is_sold: true } : c)));
  }

  async function handleMarkAsAvailable(carId: string) {
    if (!confirm(t("markAsAvailableConfirm"))) return;
    await supabase.from("cars").update({ is_sold: false }).eq("id", carId);
    setCars((prev) => prev.map((c) => (c.id === carId ? { ...c, is_sold: false } : c)));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  const hasContact = !!(profile?.phone && profile.phone.replace(/\D/g, "").length >= 9);
  const canListCars = isVerified(user);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading text-[var(--foreground)]">Seller Dashboard</h1>
          {profile?.company_name && (
            <p className="mt-1 text-caption font-medium text-[var(--accent)]">
              {profile.company_name}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {cars.filter((c) => c.is_approved && !c.is_draft && !c.is_sold).length > 0 && profile && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${profile.company_name || profile.full_name || "My listings"} - ${cars.filter((c) => c.is_approved && !c.is_draft && !c.is_sold).length} cars on DRCCARS: ${SITE_URL}/seller/${profile.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent inline-flex items-center gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t("shareMyListings")}
            </a>
          )}
          <Link href="/dashboard/settings" className="text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            {t("contactSettings")}
          </Link>
          <Link href="/dashboard" className="text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            ← {t("backToDashboard")}
          </Link>
        </div>
      </div>

      <div className="mb-6 border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          {(["overview", "listings", "rdv"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-3 text-caption font-medium transition-colors ${
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab === "overview" ? t("tabOverview") : tab === "listings" ? t("tabListings") : t("tabRendezVous")}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <>
          {!hasContact && (
            <div className="mb-6 rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-body text-amber-800 dark:text-amber-200">
                {t("contactSettingsDesc")} {t("contactOptionalHint")}
              </p>
              <Link href="/dashboard/settings" className="mt-2 inline-block text-caption font-medium text-amber-700 underline dark:text-amber-300">
                {t("contactSettings")} →
              </Link>
            </div>
          )}
          {visibleAdminMessages.length > 0 && (
            <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Messages from admin</h2>
                <button type="button" onClick={clearAllAdminMessages} className="text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Clear all</button>
              </div>
              <ul className="space-y-3">
                {visibleAdminMessages.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--foreground)]">{m.subject}</p>
                      <p className="mt-1 whitespace-pre-wrap text-[11px] text-[var(--muted-foreground)]">{m.body}</p>
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                    <button type="button" onClick={() => dismissAdminMessage(m.id)} className="shrink-0 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Dismiss</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="My listings" value={cars.length} />
            <StatCard label="Approved RDV" value={approvedRdv.length} />
            <StatCard label="Total views" value={Object.values(stats).reduce((a, s) => a + s.views, 0)} />
            <StatCard label="Favorites" value={Object.values(stats).reduce((a, s) => a + s.favorites, 0)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-body text-[var(--muted-foreground)]">
              {canListCars ? t("yourListingsNote") : t("verifyEmailToAdd")}
            </p>
            {canListCars ? (
              <Link href="/dashboard/cars/new" className="btn-primary">{t("addCar")}</Link>
            ) : (
              <Link href="/dashboard/cars/new" className="btn-secondary">{t("addCarVerifyFirst")}</Link>
            )}
          </div>
        </>
      )}

      {activeTab === "rdv" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-body font-semibold text-[var(--foreground)]">Approved rendez-vous</h2>
            {visibleApprovedRdv.length > 0 && (
              <button type="button" onClick={clearAllRdv} className="text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Clear all</button>
            )}
          </div>
          <p className="text-caption mb-4 text-[var(--muted-foreground)]">
            Meeting requests approved by admin. The admin has shared your contact with the buyer.
          </p>
          {visibleApprovedRdv.length === 0 ? (
            <div className="card-premium p-8 text-center">
              <p className="text-body text-[var(--muted-foreground)]">No approved rendez-vous yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleApprovedRdv.map((rdv) => (
                <li key={rdv.id} className="card-compact flex items-center justify-between gap-4 p-3">
                  <div>
                    <span className="text-caption text-[var(--foreground)]">
                      {(rdv.cars && typeof rdv.cars === "object" && "title" in rdv.cars) ? (rdv.cars as { title: string }).title : "Car"}
                    </span>
                    {rdv.suggested_price != null && rdv.suggested_price > 0 && (
                      <p className="mt-0.5 text-[10px] font-medium text-[var(--foreground)]">
                        Buyer offer: {formatPrice(rdv.suggested_price, "USD", null)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {new Date(rdv.created_at).toLocaleDateString()}
                    </span>
                    <button type="button" onClick={() => dismissRdv(rdv.id)} className="text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Dismiss</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "listings" && (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-body text-[var(--muted-foreground)]">
              {canListCars ? t("yourListingsNote") : t("verifyEmailToAdd")}
            </p>
            {canListCars ? (
              <Link href="/dashboard/cars/new" className="btn-primary">{t("addCar")}</Link>
            ) : (
              <Link href="/dashboard/cars/new" className="btn-secondary">{t("addCarVerifyFirst")}</Link>
            )}
          </div>
          {cars.length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center gap-2 p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">No listings yet. Click &quot;Add car&quot; to create one.</p>
              <Link href="/dashboard/cars/new" className="btn-primary mt-2">{t("addCar")}</Link>
            </div>
          ) : (
            <ul className="space-y-3">
          {cars.map((car) => (
            <li key={car.id} className="card-premium flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--foreground)]">{car.title}</p>
                <p className="text-small text-[var(--muted-foreground)]">
                  {car.make} {car.model}
                  {car.year != null ? ` · ${car.year}` : ""} · {formatPrice(car.price, "USD", "USD")}
                </p>
                <span
                  className={`mt-1 inline-block rounded-[var(--radius)] px-2 py-0.5 text-caption ${
                    car.is_sold
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : car.is_draft === true
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        : car.is_approved
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {car.is_sold ? t("sold") : car.is_draft ? t("draft") : car.is_approved ? "Approved" : "Pending approval"}
                </span>
                {!car.is_draft && !car.is_approved && car.rejection_reason && (
                  <div className="mt-2 rounded-[var(--radius)] border border-amber-200 bg-amber-50 p-2 text-caption text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    <p className="font-medium">{t("rejectionReason")}: {car.rejection_reason}</p>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Re: Listing - ${car.title}`)}`} className="mt-1 inline-block text-[10px] font-medium text-amber-700 underline dark:text-amber-300">
                      {t("reachOut")} →
                    </a>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[var(--muted-foreground)]">
                  <span>Views: <span className="font-semibold text-[var(--foreground)]">{stats[car.id]?.views ?? 0}</span></span>
                  <span>Favorites: <span className="font-semibold text-[var(--foreground)]">{stats[car.id]?.favorites ?? 0}</span></span>
                  <span>Unlocks: <span className="font-semibold text-[var(--foreground)]">{stats[car.id]?.unlocks ?? 0}</span></span>
                  <span>RDV: <span className="font-semibold text-[var(--foreground)]">{stats[car.id]?.rdv ?? 0}</span></span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/cars/${car.id}/edit`} className="btn-secondary py-2">Edit</Link>
                {!car.is_sold && car.is_approved && !car.is_draft && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsSold(car.id)}
                    className="rounded-[var(--radius)] border border-emerald-200 px-3 py-2 text-small font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  >
                    {t("markAsSold")}
                  </button>
                )}
                {car.is_sold && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsAvailable(car.id)}
                    className="rounded-[var(--radius)] border border-emerald-200 px-3 py-2 text-small font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  >
                    {t("markAsAvailable")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(car.id)}
                  className="rounded-[var(--radius)] border border-red-200 px-3 py-2 text-small font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
