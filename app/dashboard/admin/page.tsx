"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { formatPrice } from "@/lib/format-utils";

type Car = {
  id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number | null;
  is_approved: boolean;
  is_draft?: boolean;
  boost_score?: number | null;
  rejection_reason: string | null;
  owner_id: string;
  owner_phone: string | null;
  owner_whatsapp: string | null;
  owner_address: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone_verified?: boolean;
  id_verified?: boolean;
  dealer_verified?: boolean;
};

type RdvRequest = {
  id: string;
  car_id: string;
  message: string | null;
  preferred_date: string | null;
  suggested_price: number | null;
  status: string;
  created_at: string;
  buyer_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  cars: { title: string; owner_id: string }[] | null;
  seller_profile?: Profile | null;
  car_owner_phone?: string | null;
  car_owner_whatsapp?: string | null;
  car_owner_address?: string | null;
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-premium p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--foreground)]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [profile, setProfile] = useState<{ role: string } | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [rdvRequests, setRdvRequests] = useState<RdvRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "rdv" | "sellers" | "messages" | "analytics" | "users" | "traffic">("listings");
  const [rejectModal, setRejectModal] = useState<{ carId: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  type AdminMsg = { id: string; target_audience: string; subject: string; body: string; created_at: string };
  const [adminMessages, setAdminMessages] = useState<AdminMsg[]>([]);
  const [messageTarget, setMessageTarget] = useState<"sellers" | "buyers">("sellers");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  type SearchStats = { topKeywords: { term: string; count: number }[]; topMakes: { make: string; count: number }[]; topProvinces: { province: string; count: number }[] };
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  type UserStats = {
    total?: number;
    sellers?: number;
    buyers?: number;
    admins?: number;
    byDay?: { date: string; count: number; sellers: number; buyers: number; admins: number }[];
    byWeek?: { week: string; count: number; sellers: number; buyers: number; admins: number }[];
    byMonth?: { month: string; count: number; sellers: number; buyers: number; admins: number }[];
    byYear?: { year: string; count: number; sellers: number; buyers: number; admins: number }[];
    error?: string;
  };
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  type VisitStats = {
    total?: number;
    byDay?: { date: string; count: number }[];
    byWeek?: { week: string; count: number }[];
    byMonth?: { month: string; count: number }[];
    byYear?: { year: string; count: number }[];
    error?: string;
  };
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/dashboard/admin");
        return;
      }
      const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profileData?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setProfile(profileData);

      const { data: carsData } = await supabase
        .from("cars")
        .select("id, title, price, make, model, year, is_approved, is_draft, boost_score, rejection_reason, owner_id, owner_phone, owner_whatsapp, owner_address")
        .order("boost_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      const carsList = (carsData as Car[]) ?? [];
      setCars(carsList);

      const ownerIds = [...new Set(carsList.map((c) => c.owner_id).filter(Boolean))];
      if (ownerIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, full_name, company_name, phone_verified, id_verified, dealer_verified")
          .in("id", ownerIds);
        const profMap: Record<string, Profile> = {};
        (profData ?? []).forEach((p) => { profMap[p.id] = p; });
        setProfiles(profMap);
      }

      const { data: rdvData } = await supabase
        .from("rendezvous_requests")
        .select(`
          id, car_id, message, preferred_date, suggested_price, status, created_at,
          buyer_email, buyer_name, buyer_phone,
          cars(title, owner_id, owner_phone, owner_whatsapp, owner_address)
        `)
        .order("created_at", { ascending: false });
      const rdvList = (rdvData ?? []) as RdvRequest[];
      setRdvRequests(rdvList);

      const { data: msgData } = await supabase
        .from("admin_messages")
        .select("id, target_audience, subject, body, created_at")
        .order("created_at", { ascending: false });
      setAdminMessages((msgData ?? []) as AdminMsg[]);

      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (activeTab !== "analytics" || !profile) return;
    (async () => {
      const { data } = await supabase
        .from("search_logs")
        .select("keyword, make, province")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      const logs = (data ?? []) as { keyword: string | null; make: string | null; province: string | null }[];
      const kwCounts: Record<string, number> = {};
      const makeCounts: Record<string, number> = {};
      const provCounts: Record<string, number> = {};
      logs.forEach((row) => {
        if (row.keyword) { kwCounts[row.keyword] = (kwCounts[row.keyword] ?? 0) + 1; }
        if (row.make) { makeCounts[row.make] = (makeCounts[row.make] ?? 0) + 1; }
        if (row.province) { provCounts[row.province] = (provCounts[row.province] ?? 0) + 1; }
      });
      setSearchStats({
        topKeywords: Object.entries(kwCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([term, count]) => ({ term, count })),
        topMakes: Object.entries(makeCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([make, count]) => ({ make, count })),
        topProvinces: Object.entries(provCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([province, count]) => ({ province, count })),
      });
    })();
  }, [activeTab, profile]);

  useEffect(() => {
    if (activeTab !== "users" || !profile) return;
    (async () => {
      const { data, error } = await supabase.rpc("admin_get_registration_stats");
      if (error) {
        setUserStats({ error: error.message });
        return;
      }
      const raw = data as UserStats & { byDay?: unknown[]; byWeek?: unknown[]; byMonth?: unknown[]; byYear?: unknown[] };
      if (raw?.error) {
        setUserStats({ error: raw.error });
        return;
      }
      setUserStats({
        total: raw?.total ?? 0,
        sellers: raw?.sellers ?? 0,
        buyers: raw?.buyers ?? 0,
        admins: raw?.admins ?? 0,
        byDay: Array.isArray(raw?.byDay) ? raw.byDay as UserStats["byDay"] : [],
        byWeek: Array.isArray(raw?.byWeek) ? raw.byWeek as UserStats["byWeek"] : [],
        byMonth: Array.isArray(raw?.byMonth) ? raw.byMonth as UserStats["byMonth"] : [],
        byYear: Array.isArray(raw?.byYear) ? raw.byYear as UserStats["byYear"] : [],
      });
    })();
  }, [activeTab, profile]);

  useEffect(() => {
    if (activeTab !== "traffic" || !profile) return;
    (async () => {
      const { data, error } = await supabase.rpc("admin_get_visit_stats");
      if (error) {
        setVisitStats({ error: error.message });
        return;
      }
      const raw = data as VisitStats & { byDay?: unknown[]; byWeek?: unknown[]; byMonth?: unknown[]; byYear?: unknown[] };
      if (raw?.error) {
        setVisitStats({ error: raw.error });
        return;
      }
      setVisitStats({
        total: raw?.total ?? 0,
        byDay: Array.isArray(raw?.byDay) ? (raw.byDay as VisitStats["byDay"]) : [],
        byWeek: Array.isArray(raw?.byWeek) ? (raw.byWeek as VisitStats["byWeek"]) : [],
        byMonth: Array.isArray(raw?.byMonth) ? (raw.byMonth as VisitStats["byMonth"]) : [],
        byYear: Array.isArray(raw?.byYear) ? (raw.byYear as VisitStats["byYear"]) : [],
      });
    })();
  }, [activeTab, profile]);

  async function sendAdminMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageSubject.trim() || !messageBody.trim()) return;
    setMessageSending(true);
    setMessageError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("admin_messages").insert({
      target_audience: messageTarget,
      subject: messageSubject.trim(),
      body: messageBody.trim(),
      created_by: user?.id ?? null,
    });
    if (error) {
      setMessageError(error.message || "Failed to send message.");
      setMessageSending(false);
      return;
    }
    const { data: msgData } = await supabase
      .from("admin_messages")
      .select("id, target_audience, subject, body, created_at")
      .order("created_at", { ascending: false });
    setAdminMessages((msgData ?? []) as AdminMsg[]);
    setMessageSubject("");
    setMessageBody("");
    setMessageSending(false);
  }

  async function approveCar(carId: string) {
    await supabase.from("cars").update({ is_approved: true, is_draft: false, rejection_reason: null }).eq("id", carId);
    setCars((prev) =>
      prev.map((c) => (c.id === carId ? { ...c, is_approved: true, is_draft: false, rejection_reason: null } : c))
    );
  }

  function openRejectModal(car: Car) {
    setRejectModal({ carId: car.id, title: car.title });
    setRejectReason(car.rejection_reason ?? "");
  }

  async function submitReject() {
    if (!rejectModal) return;
    await supabase
      .from("cars")
      .update({ is_approved: false, rejection_reason: rejectReason.trim() || null })
      .eq("id", rejectModal.carId);
    setCars((prev) =>
      prev.map((c) =>
        c.id === rejectModal.carId
          ? { ...c, is_approved: false, rejection_reason: rejectReason.trim() || null }
          : c
      )
    );
    setRejectModal(null);
    setRejectReason("");
  }

  async function deleteCar(carId: string) {
    if (!confirm("Permanently remove this listing? This cannot be undone.")) return;
    await supabase.from("cars").delete().eq("id", carId);
    setCars((prev) => prev.filter((c) => c.id !== carId));
  }

  async function deleteListing(carId: string) {
    if (!confirm(t("adminDeleteListingConfirm"))) return;
    await supabase.from("cars").delete().eq("id", carId);
    setCars((prev) => prev.filter((c) => c.id !== carId));
  }

  async function approveRdv(rdvId: string) {
    await supabase.from("rendezvous_requests").update({ status: "approved" }).eq("id", rdvId);
    setRdvRequests((prev) => prev.map((r) => (r.id === rdvId ? { ...r, status: "approved" } : r)));
  }

  async function deleteRdv(rdvId: string) {
    if (!confirm("Remove this meeting request from the list? This cannot be undone.")) return;
    await supabase.from("rendezvous_requests").delete().eq("id", rdvId);
    setRdvRequests((prev) => prev.filter((r) => r.id !== rdvId));
  }

  async function deleteAdminMessage(msgId: string) {
    if (!confirm("Delete this message? It will be removed for everyone.")) return;
    await supabase.from("admin_messages").delete().eq("id", msgId);
    setAdminMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function updateSellerVerification(
    profileId: string,
    field: "phone_verified" | "id_verified" | "dealer_verified",
    value: boolean
  ) {
    await supabase.from("profiles").update({ [field]: value }).eq("id", profileId);
    setProfiles((prev) => ({
      ...prev,
      [profileId]: { ...prev[profileId], [field]: value },
    }));
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  const totalListings = cars.length;
  const approvedListings = cars.filter((c) => c.is_approved && !c.is_draft).length;
  const pendingListings = cars.filter((c) => !c.is_approved && !c.is_draft).length;
  const draftListings = cars.filter((c) => c.is_draft).length;
  const uniqueBrands = new Set(profiles ? Object.values(profiles).map((p) => p.company_name).filter(Boolean) : []).size;
  const pendingRdv = rdvRequests.filter((r) => r.status === "pending").length;
  const approvedRdv = rdvRequests.filter((r) => r.status === "approved").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-heading text-[var(--foreground)]">Admin Dashboard</h1>
        <Link href="/dashboard" className="text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          ← {t("backToDashboard")}
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Total listings" value={totalListings} />
        <StatCard label="Approved" value={approvedListings} sub="Live on site" />
        <StatCard label="Pending" value={pendingListings} sub="Awaiting review" />
        <StatCard label="Drafts" value={draftListings} />
        <StatCard label="Seller brands" value={uniqueBrands} />
        <StatCard label="RDV pending" value={pendingRdv} sub={`${approvedRdv} approved`} />
      </div>

      <div className="mb-6 flex gap-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`border-b-2 px-4 py-2 text-[11px] font-medium transition ${
            activeTab === "listings"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Listings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rdv")}
          className={`border-b-2 px-4 py-2 text-[11px] font-medium transition ${
            activeTab === "rdv"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Rendez-vous ({rdvRequests.length})
          {pendingRdv > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] text-black">
              {pendingRdv}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sellers")}
          className={`border-b-2 px-4 py-2 text-[11px] font-medium transition ${
            activeTab === "sellers"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Sellers
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`border-b-2 px-4 py-2 text-[11px] font-medium transition ${
            activeTab === "analytics"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Search analytics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`border-b-2 px-4 py-2 text-[11px] font-medium transition ${
            activeTab === "users"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("traffic")}
          className={`border-b-2 px-4 py-2 text-[11px] font-medium transition ${
            activeTab === "traffic"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Traffic
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("messages")}
          className={`border-b-2 px-4 py-2 text-[11px] font-medium transition ${
            activeTab === "messages"
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          Messages
        </button>
      </div>

      {activeTab === "analytics" ? (
        <div className="space-y-6">
          <p className="text-caption text-[var(--muted-foreground)]">
            What buyers are searching for (last 30 days). Use this to understand demand.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="card-premium p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Top keywords</h3>
              {searchStats?.topKeywords.length ? (
                <ul className="space-y-2">
                  {searchStats.topKeywords.map(({ term, count }) => (
                    <li key={term} className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate text-[var(--foreground)]">{term || "(empty)"}</span>
                      <span className="shrink-0 font-medium text-[var(--accent)]">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[var(--muted-foreground)]">No search data yet.</p>
              )}
            </div>
            <div className="card-premium p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Top makes</h3>
              {searchStats?.topMakes.length ? (
                <ul className="space-y-2">
                  {searchStats.topMakes.map(({ make, count }) => (
                    <li key={make} className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate text-[var(--foreground)]">{make}</span>
                      <span className="shrink-0 font-medium text-[var(--accent)]">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[var(--muted-foreground)]">No search data yet.</p>
              )}
            </div>
            <div className="card-premium p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Top locations</h3>
              {searchStats?.topProvinces.length ? (
                <ul className="space-y-2">
                  {searchStats.topProvinces.map(({ province, count }) => (
                    <li key={province} className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate text-[var(--foreground)]">{province}</span>
                      <span className="shrink-0 font-medium text-[var(--accent)]">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[var(--muted-foreground)]">No search data yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "users" ? (
        <div className="space-y-6">
          <p className="text-caption text-[var(--muted-foreground)]">
            Registered users over time. Sellers and buyers from signup; no external analytics.
          </p>
          {userStats?.error ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{userStats.error}</p>
          ) : userStats ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total users" value={userStats.total ?? 0} />
                <StatCard label="Sellers" value={userStats.sellers ?? 0} />
                <StatCard label="Buyers" value={userStats.buyers ?? 0} />
                <StatCard label="Admins" value={userStats.admins ?? 0} />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By day (last 366 days)</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Date</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="py-2 text-right">Sellers</th>
                          <th className="py-2 text-right">Buyers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(userStats.byDay ?? []).map((row) => (
                          <tr key={row.date} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.date}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                            <td className="py-1.5 text-right">{row.sellers}</td>
                            <td className="py-1.5 text-right">{row.buyers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By week (last ~2 years)</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Week</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="py-2 text-right">Sellers</th>
                          <th className="py-2 text-right">Buyers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(userStats.byWeek ?? []).map((row) => (
                          <tr key={row.week} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.week}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                            <td className="py-1.5 text-right">{row.sellers}</td>
                            <td className="py-1.5 text-right">{row.buyers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By month (last 24 months)</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Month</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="py-2 text-right">Sellers</th>
                          <th className="py-2 text-right">Buyers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(userStats.byMonth ?? []).map((row) => (
                          <tr key={row.month} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.month}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                            <td className="py-1.5 text-right">{row.sellers}</td>
                            <td className="py-1.5 text-right">{row.buyers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By year</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Year</th>
                          <th className="py-2 text-right">Total</th>
                          <th className="py-2 text-right">Sellers</th>
                          <th className="py-2 text-right">Buyers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(userStats.byYear ?? []).map((row) => (
                          <tr key={row.year} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.year}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                            <td className="py-1.5 text-right">{row.sellers}</td>
                            <td className="py-1.5 text-right">{row.buyers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-caption text-[var(--muted-foreground)]">Loading…</p>
          )}
        </div>
      ) : activeTab === "traffic" ? (
        <div className="space-y-6">
          <p className="text-caption text-[var(--muted-foreground)]">
            Visitor sessions (one per browser session). Logged in-app; no external analytics.
          </p>
          {visitStats?.error ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{visitStats.error}</p>
          ) : visitStats ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard label="Total sessions" value={visitStats.total ?? 0} sub="All time" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By day</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Date</th>
                          <th className="py-2 text-right">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(visitStats.byDay ?? []).map((row) => (
                          <tr key={row.date} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.date}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By week</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Week</th>
                          <th className="py-2 text-right">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(visitStats.byWeek ?? []).map((row) => (
                          <tr key={row.week} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.week}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By month</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Month</th>
                          <th className="py-2 text-right">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(visitStats.byMonth ?? []).map((row) => (
                          <tr key={row.month} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.month}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By year</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">Year</th>
                          <th className="py-2 text-right">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(visitStats.byYear ?? []).map((row) => (
                          <tr key={row.year} className="border-b border-[var(--border)]/50">
                            <td className="py-1.5">{row.year}</td>
                            <td className="py-1.5 text-right">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-caption text-[var(--muted-foreground)]">Loading…</p>
          )}
        </div>
      ) : activeTab === "messages" ? (
        <>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            Send internal messages to all sellers or all buyers. Messages are visible in their dashboard.
          </p>
          <form onSubmit={sendAdminMessage} className="card-premium mb-6 p-4">
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">To</label>
              <select
                value={messageTarget}
                onChange={(e) => setMessageTarget(e.target.value as "sellers" | "buyers")}
                className="input-premium w-full max-w-xs"
              >
                <option value="sellers">All sellers</option>
                <option value="buyers">All buyers</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">Subject</label>
              <input
                type="text"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="e.g. Important update for sellers"
                className="input-premium w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">Message</label>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Write your message..."
                className="input-premium w-full min-h-[120px]"
                rows={5}
                required
              />
            </div>
            {messageError && (
              <p className="mb-4 text-[11px] text-red-600 dark:text-red-400">{messageError}</p>
            )}
            <button type="submit" disabled={messageSending} className="btn-primary py-2 text-[11px]">
              {messageSending ? "Sending…" : "Send message"}
            </button>
          </form>
          {adminMessages.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Sent messages</h3>
              <ul className="space-y-3">
                {adminMessages.map((m) => (
                  <li key={m.id} className="card-compact flex flex-wrap items-start justify-between gap-2 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--foreground)]">
                          {m.target_audience}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {new Date(m.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-semibold text-[var(--foreground)]">{m.subject}</p>
                      <p className="mt-1 whitespace-pre-wrap text-[11px] text-[var(--muted-foreground)]">{m.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAdminMessage(m.id)}
                      className="shrink-0 rounded border border-red-300 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {adminMessages.length === 0 && (
            <p className="text-caption text-[var(--muted-foreground)]">No messages sent yet.</p>
          )}
        </>
      ) : activeTab === "sellers" ? (
        <>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            Set verification badges for sellers. At least one checked = &quot;Verified Seller&quot; badge.
          </p>
          {Object.keys(profiles).length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center gap-2 p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">No sellers yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {Object.entries(profiles).map(([id, p]) => (
                <li key={id} className="card-premium flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{p.full_name ?? "—"}</p>
                    {p.company_name && (
                      <p className="text-[11px] text-[var(--muted-foreground)]">{p.company_name}</p>
                    )}
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {cars.filter((c) => c.owner_id === id).length} listing(s)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={!!p.phone_verified}
                        onChange={(e) => updateSellerVerification(id, "phone_verified", e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      Phone
                    </label>
                    <label className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={!!p.id_verified}
                        onChange={(e) => updateSellerVerification(id, "id_verified", e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      ID checked
                    </label>
                    <label className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={!!p.dealer_verified}
                        onChange={(e) => updateSellerVerification(id, "dealer_verified", e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      Dealer
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : activeTab === "rdv" ? (
        <>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            Manage meeting requests. Approve to notify the seller. All buyer and seller contacts visible here only.
          </p>
          {rdvRequests.length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center gap-2 p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">No rendez-vous requests yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {rdvRequests.map((rdv) => {
                const carRel = rdv.cars;
                const carData = Array.isArray(carRel) ? carRel[0] : carRel;
                const title = (carData && typeof carData === "object" && "title" in carData) ? (carData as { title?: string }).title : "Car";
                const ownerId = (carData && typeof carData === "object" && "owner_id" in carData) ? (carData as { owner_id?: string }).owner_id : null;
                const sellerProfile = ownerId ? profiles[ownerId] : null;
                const brand = sellerProfile?.company_name ?? sellerProfile?.full_name ?? "—";
                const ownerCar = cars.find((c) => c.owner_id === ownerId);
                const ownerPhone = (carData && typeof carData === "object" && "owner_phone" in carData)
                  ? (carData as { owner_phone?: string }).owner_phone
                  : ownerCar?.owner_phone;
                const ownerWhatsapp = (carData && typeof carData === "object" && "owner_whatsapp" in carData)
                  ? (carData as { owner_whatsapp?: string }).owner_whatsapp
                  : ownerCar?.owner_whatsapp;
                const ownerAddress = (carData && typeof carData === "object" && "owner_address" in carData)
                  ? (carData as { owner_address?: string }).owner_address
                  : ownerCar?.owner_address;
                return (
                  <li key={rdv.id} className="card-premium overflow-hidden p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--foreground)]">{title}</p>
                        <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                          <div className="rounded bg-[var(--background)] p-2">
                            <p className="font-semibold text-[var(--muted-foreground)]">Buyer</p>
                            <p>{(rdv.buyer_name || rdv.buyer_email) ?? "—"}</p>
                            <p>{rdv.buyer_email ?? "—"}</p>
                            <p>{rdv.buyer_phone ?? "—"}</p>
                          </div>
                          <div className="rounded bg-[var(--background)] p-2">
                            <p className="font-semibold text-[var(--muted-foreground)]">Seller / Brand</p>
                            <p>{brand}</p>
                            <p>Phone: {ownerPhone ?? "—"}</p>
                            <p>WhatsApp: {ownerWhatsapp ?? "—"}</p>
                            <p>Address: {ownerAddress ?? "—"}</p>
                          </div>
                        </div>
                        {rdv.message && (
                          <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                            Message: {rdv.message}
                          </p>
                        )}
                        {rdv.preferred_date && (
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            Preferred: {rdv.preferred_date}
                          </p>
                        )}
                        {rdv.suggested_price != null && rdv.suggested_price > 0 && (
                          <p className="text-[11px] font-medium text-[var(--foreground)]">
                            Price willing to pay (if good): {Number(rdv.suggested_price).toLocaleString()}
                          </p>
                        )}
                        <span
                          className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] ${
                            rdv.status === "pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {rdv.status}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {rdv.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => approveRdv(rdv.id)}
                            className="btn-primary py-2 text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteRdv(rdv.id)}
                          className="rounded border border-red-300 px-3 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <>
          <p className="mb-6 text-caption text-[var(--muted-foreground)]">
            Approve listings so they appear on the site. Seller contact info only visible here.
          </p>
          {cars.length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center gap-2 p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">No listings yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cars.map((car) => {
                const seller = profiles[car.owner_id];
                const brand = seller?.company_name ?? seller?.full_name ?? "—";
                return (
                  <li key={car.id} className="card-premium p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{car.title}</p>
                        <p className="text-caption text-[var(--muted-foreground)]">
                          {car.make} {car.model}
                          {car.year != null ? ` · ${car.year}` : ""} · {formatPrice(car.price, "USD", "USD")}
                          {car.is_draft && (
                            <span className="ml-1 rounded bg-slate-200 px-1 dark:bg-slate-600">Draft</span>
                          )}
                          {(car.boost_score ?? 0) > 0 && (
                            <span className="ml-1 rounded bg-[var(--accent)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                              Boost {car.boost_score}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                          Brand: {brand}
                        </p>
                        <div className="mt-2 rounded bg-[var(--background)] p-2 text-[10px]">
                          <p>Phone: {car.owner_phone ?? "—"}</p>
                          <p>WhatsApp: {car.owner_whatsapp ?? "—"}</p>
                          <p>Address: {car.owner_address ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={car.boost_score ?? 0}
                          onChange={async (e) => {
                            const v = parseInt(e.target.value, 10);
                            await supabase.from("cars").update({ boost_score: v }).eq("id", car.id);
                            setCars((prev) => prev.map((c) => (c.id === car.id ? { ...c, boost_score: v } : c)));
                          }}
                          className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[10px] text-[var(--foreground)]"
                          title="Rank higher: higher score = appears first in browse"
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n === 0 ? "No boost" : `Boost ${n}`}</option>
                          ))}
                        </select>
                        <Link
                          href={`/cars/${car.id}?preview=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded border border-[var(--border)] px-3 py-1.5 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--background)] dark:hover:bg-[var(--border)]"
                        >
                          Preview
                        </Link>
                        {car.is_approved ? (
                          <button
                            type="button"
                            onClick={() => openRejectModal(car)}
                            className="rounded border border-amber-500 px-3 py-1.5 text-[10px] font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                          >
                            Reject
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => approveCar(car.id)}
                            className="btn-primary py-1.5 text-[10px]"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteListing(car.id)}
                          className="rounded border border-red-300 px-3 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          {t("adminDeleteListing")}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-premium w-full max-w-md p-6">
            <h3 className="mb-2 font-semibold text-[var(--foreground)]">Reject: {rejectModal.title}</h3>
            <p className="mb-2 text-caption text-[var(--muted-foreground)]">
              Give a reason (optional). The seller will see this.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Photos unclear, price missing..."
              className="input-premium mb-4 w-full"
              rows={3}
            />
            <div className="flex gap-2">
              <button type="button" onClick={submitReject} className="btn-primary py-2 text-[11px]">
                Reject
              </button>
              <button
                type="button"
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="btn-secondary py-2 text-[11px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
