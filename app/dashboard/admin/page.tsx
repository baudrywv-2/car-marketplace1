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
  intent?: string | null;
  message: string | null;
  preferred_date: string | null;
  suggested_price: number | null;
  status: string;
  created_at: string;
  buyer_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  cars: { title?: string; listing_type?: string; owner_id?: string }[] | { title?: string; listing_type?: string; owner_id?: string } | null;
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
  const [trafficFrom, setTrafficFrom] = useState("");
  const [trafficTo, setTrafficTo] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [adminListingsError, setAdminListingsError] = useState<string | null>(null);
  const [rdvFetchError, setRdvFetchError] = useState<string | null>(null);

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

      // Use admin_get_cars RPC (bypasses RLS) so admin always sees all listings including pending
      const { data: carsRpc, error: carsRpcError } = await supabase.rpc("admin_get_cars");
      let carsList: Car[] = [];
      if (!carsRpcError && Array.isArray(carsRpc)) {
        carsList = carsRpc as Car[];
      } else {
        // Fallback: direct select (RLS applies - may hide cars if is_admin() fails)
        const { data: carsData } = await supabase
          .from("cars")
          .select("id, title, price, make, model, year, is_approved, is_draft, boost_score, rejection_reason, owner_id, owner_phone, owner_whatsapp, owner_address")
          .order("boost_score", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
        carsList = (carsData as Car[]) ?? [];
      }
      setCars(carsList);
      setAdminListingsError(carsRpcError?.message ?? null);

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

      // API route uses service role (bypasses RLS) — single source of truth for admin RDV
      let rdvList: RdvRequest[] = [];
      setRdvFetchError(null);
      try {
        const res = await fetch("/api/admin/rdv", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json)) {
          rdvList = json as RdvRequest[];
        } else {
          const errMsg = (json as { error?: string }).error || `HTTP ${res.status}`;
          setRdvFetchError(errMsg);
        }
      } catch (e) {
        setRdvFetchError(e instanceof Error ? e.message : t("adminNetworkError"));
      }
      setRdvRequests(rdvList);

      const { data: msgData } = await supabase
        .from("admin_messages")
        .select("id, target_audience, subject, body, created_at")
        .order("created_at", { ascending: false });
      setAdminMessages((msgData ?? []) as AdminMsg[]);

      setLoading(false);
    }
    load();
  }, [router, refreshTrigger]);

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
      const fromDate = trafficFrom.trim() || null;
      const toDate = trafficTo.trim() || null;
      const { data, error } = await supabase.rpc("admin_get_visit_stats_filtered", {
        p_from_date: fromDate,
        p_to_date: toDate,
      });
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
  }, [activeTab, profile, trafficFrom, trafficTo]);

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
      setMessageError(error.message || t("adminFailedSendMessage"));
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
    if (!confirm(t("adminRemoveListingConfirm"))) return;
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
    if (!confirm(t("adminRemoveRdvConfirm"))) return;
    await supabase.from("rendezvous_requests").delete().eq("id", rdvId);
    setRdvRequests((prev) => prev.filter((r) => r.id !== rdvId));
  }

  async function deleteAdminMessage(msgId: string) {
    if (!confirm(t("adminDeleteMessageConfirm"))) return;
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
        <h1 className="text-heading text-[var(--foreground)]">{t("adminDashboard")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setLoading(true); setRefreshTrigger((t) => t + 1); }}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
          >
            {t("adminRefresh")}
          </button>
          <Link href="/dashboard" className="text-caption text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            ← {t("backToDashboard")}
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard label={t("adminTotalListings")} value={totalListings} />
        <StatCard label={t("approved")} value={approvedListings} sub={t("adminLiveOnSite")} />
        <StatCard label={t("pending")} value={pendingListings} sub={t("adminAwaitingReview")} />
        <StatCard label={t("draftListings")} value={draftListings} />
        <StatCard label={t("adminSellerBrands")} value={uniqueBrands} />
        <StatCard label={t("adminRdvPending")} value={pendingRdv} sub={t("adminApprovedCount").replace("{n}", String(approvedRdv))} />
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
          {t("adminTabListings")}
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
          {t("adminTabRdv")} ({rdvRequests.length})
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
          {t("adminTabSellers")}
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
          {t("adminTabAnalytics")}
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
          {t("adminTabUsers")}
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
          {t("adminTabTraffic")}
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
          {t("adminTabMessages")}
        </button>
      </div>

      {activeTab === "analytics" ? (
        <div className="space-y-6">
          <p className="text-caption text-[var(--muted-foreground)]">
            {t("adminAnalyticsHelp")}
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="card-premium p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminTopKeywords")}</h3>
              {searchStats?.topKeywords.length ? (
                <ul className="space-y-2">
                  {searchStats.topKeywords.map(({ term, count }) => (
                    <li key={term} className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate text-[var(--foreground)]">{term || t("adminEmptyValue")}</span>
                      <span className="shrink-0 font-medium text-[var(--accent)]">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-[var(--muted-foreground)]">{t("adminNoSearchData")}</p>
              )}
            </div>
            <div className="card-premium p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminTopMakes")}</h3>
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
                <p className="text-[11px] text-[var(--muted-foreground)]">{t("adminNoSearchData")}</p>
              )}
            </div>
            <div className="card-premium p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminTopLocations")}</h3>
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
                <p className="text-[11px] text-[var(--muted-foreground)]">{t("adminNoSearchData")}</p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "users" ? (
        <div className="space-y-6">
          <p className="text-caption text-[var(--muted-foreground)]">
            {t("adminUsersHelp")}
          </p>
          {userStats?.error ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{userStats.error}</p>
          ) : userStats ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label={t("adminTotalUsers")} value={userStats.total ?? 0} />
                <StatCard label={t("seller")} value={userStats.sellers ?? 0} />
                <StatCard label={t("buyer")} value={userStats.buyers ?? 0} />
                <StatCard label={t("adminRole")} value={userStats.admins ?? 0} />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByDay")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColDate")}</th>
                          <th className="py-2 text-right">{t("adminColTotal")}</th>
                          <th className="py-2 text-right">{t("seller")}</th>
                          <th className="py-2 text-right">{t("buyer")}</th>
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
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByWeek")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColWeek")}</th>
                          <th className="py-2 text-right">{t("adminColTotal")}</th>
                          <th className="py-2 text-right">{t("seller")}</th>
                          <th className="py-2 text-right">{t("buyer")}</th>
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
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByMonth")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColMonth")}</th>
                          <th className="py-2 text-right">{t("adminColTotal")}</th>
                          <th className="py-2 text-right">{t("seller")}</th>
                          <th className="py-2 text-right">{t("buyer")}</th>
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
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByYear")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColYear")}</th>
                          <th className="py-2 text-right">{t("adminColTotal")}</th>
                          <th className="py-2 text-right">{t("seller")}</th>
                          <th className="py-2 text-right">{t("buyer")}</th>
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
            <p className="text-caption text-[var(--muted-foreground)]">{t("loading")}</p>
          )}
        </div>
      ) : activeTab === "traffic" ? (
        <div className="space-y-6">
          <p className="text-caption text-[var(--muted-foreground)]">
            {t("adminTrafficHelp")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[11px]">
              <span className="font-medium text-[var(--muted-foreground)]">{t("adminFrom")}</span>
              <input
                type="date"
                value={trafficFrom}
                onChange={(e) => setTrafficFrom(e.target.value)}
                className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[11px]"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px]">
              <span className="font-medium text-[var(--muted-foreground)]">{t("adminTo")}</span>
              <input
                type="date"
                value={trafficTo}
                onChange={(e) => setTrafficTo(e.target.value)}
                className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[11px]"
              />
            </label>
            <button
              type="button"
              onClick={() => { setTrafficFrom(""); setTrafficTo(""); }}
              className="rounded border border-[var(--border)] px-2 py-1.5 text-[10px] font-medium hover:bg-[var(--border)]"
            >
              {t("adminClear")}
            </button>
            {visitStats && (() => {
              const rows = (visitStats.byDay ?? []).map((r) => ({ date: r.date, sessions: r.count }));
              const csv = "Date,Sessions\n" + rows.map((r) => `${r.date},${r.sessions}`).join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              return (
                <a
                  href={url}
                  download={`traffic-${trafficFrom || "all"}-${trafficTo || "all"}.csv`}
                  className="rounded border border-[var(--border)] px-3 py-1.5 text-[10px] font-medium hover:bg-[var(--border)]"
                  onClick={() => setTimeout(() => URL.revokeObjectURL(url), 100)}
                >
                  {t("adminExportCsv")}
                </a>
              );
            })()}
          </div>
          {visitStats?.error ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{visitStats.error}</p>
          ) : visitStats ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                  label={t("adminTotalSessions")}
                  value={visitStats.total ?? 0}
                  sub={trafficFrom || trafficTo
                    ? t("adminDateRangeTo").replace("{from}", trafficFrom || "…").replace("{to}", trafficTo || "…")
                    : t("adminAllTime")}
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card-premium overflow-hidden p-4">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByDayShort")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColDate")}</th>
                          <th className="py-2 text-right">{t("adminColSessions")}</th>
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
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByWeekShort")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColWeek")}</th>
                          <th className="py-2 text-right">{t("adminColSessions")}</th>
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
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByMonthShort")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColMonth")}</th>
                          <th className="py-2 text-right">{t("adminColSessions")}</th>
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
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminByYear")}</h3>
                  <div className="max-h-[280px] overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-[var(--card)]">
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-2 text-left font-semibold">{t("adminColYear")}</th>
                          <th className="py-2 text-right">{t("adminColSessions")}</th>
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
            <p className="text-caption text-[var(--muted-foreground)]">{t("loading")}</p>
          )}
        </div>
      ) : activeTab === "messages" ? (
        <>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            {t("adminMessagesHelp")}
          </p>
          <form onSubmit={sendAdminMessage} className="card-premium mb-6 p-4">
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">{t("adminMessageTo")}</label>
              <select
                value={messageTarget}
                onChange={(e) => setMessageTarget(e.target.value as "sellers" | "buyers")}
                className="input-premium w-full max-w-xs"
              >
                <option value="sellers">{t("adminAllSellers")}</option>
                <option value="buyers">{t("adminAllBuyers")}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">{t("adminSubject")}</label>
              <input
                type="text"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder={t("adminSubjectPlaceholder")}
                className="input-premium w-full"
                required
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-semibold text-[var(--foreground)]">{t("adminMessageBody")}</label>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder={t("adminMessagePlaceholder")}
                className="input-premium w-full min-h-[120px]"
                rows={5}
                required
              />
            </div>
            {messageError && (
              <p className="mb-4 text-[11px] text-red-600 dark:text-red-400">{messageError}</p>
            )}
            <button type="submit" disabled={messageSending} className="btn-primary py-2 text-[11px]">
              {messageSending ? t("sending") : t("adminSendMessage")}
            </button>
          </form>
          {adminMessages.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("adminSentMessages")}</h3>
              <ul className="space-y-3">
                {adminMessages.map((m) => (
                  <li key={m.id} className="card-compact flex flex-wrap items-start justify-between gap-2 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--foreground)]">
                          {m.target_audience === "sellers" ? t("adminAllSellers") : t("adminAllBuyers")}
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
                      {t("adminRemove")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {adminMessages.length === 0 && (
            <p className="text-caption text-[var(--muted-foreground)]">{t("adminNoMessages")}</p>
          )}
        </>
      ) : activeTab === "sellers" ? (
        <>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            {t("adminSellersHelp")}
          </p>
          {Object.keys(profiles).length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center gap-2 p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">{t("adminNoSellers")}</p>
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
                      {t("adminListingsCount").replace("{n}", String(cars.filter((c) => c.owner_id === id).length))}
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
                      {t("phone")}
                    </label>
                    <label className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={!!p.id_verified}
                        onChange={(e) => updateSellerVerification(id, "id_verified", e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      {t("adminIdChecked")}
                    </label>
                    <label className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={!!p.dealer_verified}
                        onChange={(e) => updateSellerVerification(id, "dealer_verified", e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      {t("adminDealer")}
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
            {t("adminRdvHelp")}
          </p>
          {rdvFetchError && (
            <div className="mb-4 rounded border border-amber-500 bg-amber-50 p-4 text-[11px] dark:border-amber-600 dark:bg-amber-900/20">
              <p className="font-semibold text-amber-800 dark:text-amber-400">{t("adminRdvLoadError")}</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">{rdvFetchError}</p>
              <p className="mt-2 text-amber-600 dark:text-amber-400">
                {t("adminRdvEnvHint")}
              </p>
            </div>
          )}
          {rdvRequests.length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center gap-3 p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">{t("adminNoRdv")}</p>
              <p className="max-w-sm text-[11px] text-[var(--muted-foreground)]">
                {t("adminNoRdvHint")}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {rdvRequests.map((rdv) => {
                const carRel = rdv.cars;
                const carData = Array.isArray(carRel) ? carRel[0] : carRel;
                const title = (carData && typeof carData === "object" && carData?.title) ? carData.title : t("adminViewListing");
                const intentLabel = rdv.intent === "rent" ? t("adminIntentRent") : rdv.intent === "sale" ? t("adminIntentBuy") : ((carData && "listing_type" in carData) ? (carData.listing_type === "rent" ? t("adminIntentRent") : t("adminIntentBuy")) : null);
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
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/cars/${rdv.car_id}`} className="font-semibold text-[var(--foreground)] hover:underline">
                            {title}
                          </Link>
                          <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                            ID: {rdv.car_id.slice(0, 8)}…
                          </span>
                          {intentLabel && (
                            <span className="rounded bg-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                              {intentLabel}
                            </span>
                          )}
                          <Link href={`/cars/${rdv.car_id}`} className="text-[10px] font-medium text-[var(--accent)] hover:underline">
                            {t("adminViewListing")}
                          </Link>
                        </div>
                        <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                          <div className="rounded bg-[var(--background)] p-2">
                            <p className="font-semibold text-[var(--muted-foreground)]">{t("buyer")}</p>
                            <p>{(rdv.buyer_name || rdv.buyer_email) ?? "—"}</p>
                            <p>{rdv.buyer_email ?? "—"}</p>
                            <p>{rdv.buyer_phone ?? "—"}</p>
                          </div>
                          <div className="rounded bg-[var(--background)] p-2">
                            <p className="font-semibold text-[var(--muted-foreground)]">{t("adminSellerBrand")}</p>
                            <p>{brand}</p>
                            <p>{t("phone")}: {ownerPhone ?? "—"}</p>
                            <p>{t("whatsapp")}: {ownerWhatsapp ?? "—"}</p>
                            <p>{t("address")}: {ownerAddress ?? "—"}</p>
                          </div>
                        </div>
                        {rdv.message && (
                          <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                            {t("adminMessageBody")}: {rdv.message}
                          </p>
                        )}
                        {rdv.preferred_date && (
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            {t("adminPreferredDate")}: {rdv.preferred_date}
                          </p>
                        )}
                        {rdv.suggested_price != null && rdv.suggested_price > 0 && (
                          <p className="text-[11px] font-medium text-[var(--foreground)]">
                            {t("adminPriceWilling")}: {Number(rdv.suggested_price).toLocaleString()}
                          </p>
                        )}
                        <span
                          className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] ${
                            rdv.status === "pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {rdv.status === "pending" ? t("pending") : rdv.status === "approved" ? t("approved") : rdv.status}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {rdv.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => approveRdv(rdv.id)}
                            className="btn-primary py-2 text-[11px]"
                          >
                            {t("adminApprove")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteRdv(rdv.id)}
                          className="rounded border border-red-300 px-3 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          {t("adminRemove")}
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
          {adminListingsError && cars.length === 0 && (
            <div className="mb-4 rounded border border-amber-500 bg-amber-50 p-4 text-[11px] dark:bg-amber-900/20 dark:border-amber-600">
              <p className="font-semibold text-amber-800 dark:text-amber-400">{t("adminSetupRequired")}</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                {t("adminSetupSqlHint")}
              </p>
            </div>
          )}
          <p className="mb-6 text-caption text-[var(--muted-foreground)]">
            {t("adminListingsHelp")}
          </p>
          {cars.length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center gap-2 p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">{t("adminNoListings")}</p>
              {adminListingsError && (
                <p className="mt-2 max-w-md text-[10px] text-amber-600 dark:text-amber-400">
                  {t("adminSetupSqlFallback")}
                </p>
              )}
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
                            <span className="ml-1 rounded bg-slate-200 px-1 dark:bg-slate-600">{t("draft")}</span>
                          )}
                          {(car.boost_score ?? 0) > 0 && (
                            <span className="ml-1 rounded bg-[var(--accent)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                              {t("adminBoostN").replace("{n}", String(car.boost_score))}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                          {t("adminBrandLabel")}: {brand}
                        </p>
                        <div className="mt-2 rounded bg-[var(--background)] p-2 text-[10px]">
                          <p>{t("phone")}: {car.owner_phone ?? "—"}</p>
                          <p>{t("whatsapp")}: {car.owner_whatsapp ?? "—"}</p>
                          <p>{t("address")}: {car.owner_address ?? "—"}</p>
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
                          title={t("adminBoostTitle")}
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n === 0 ? t("adminNoBoost") : t("adminBoostN").replace("{n}", String(n))}</option>
                          ))}
                        </select>
                        <Link
                          href={`/cars/${car.id}?preview=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded border border-[var(--border)] px-3 py-1.5 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--background)] dark:hover:bg-[var(--border)]"
                        >
                          {t("adminPreview")}
                        </Link>
                        {car.is_approved ? (
                          <button
                            type="button"
                            onClick={() => openRejectModal(car)}
                            className="rounded border border-amber-500 px-3 py-1.5 text-[10px] font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                          >
                            {t("adminReject")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => approveCar(car.id)}
                            className="btn-primary py-1.5 text-[10px]"
                          >
                            {t("adminApprove")}
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
            <h3 className="mb-2 font-semibold text-[var(--foreground)]">{t("adminRejectTitle").replace("{title}", rejectModal.title)}</h3>
            <p className="mb-2 text-caption text-[var(--muted-foreground)]">
              {t("adminRejectHelp")}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("adminRejectPlaceholder")}
              className="input-premium mb-4 w-full"
              rows={3}
            />
            <div className="flex gap-2">
              <button type="button" onClick={submitReject} className="btn-primary py-2 text-[11px]">
                {t("adminReject")}
              </button>
              <button
                type="button"
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="btn-secondary py-2 text-[11px]"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
