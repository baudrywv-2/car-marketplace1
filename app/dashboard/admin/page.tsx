"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useToast } from "@/app/contexts/ToastContext";
import { formatPrice } from "@/lib/format-utils";
import type { translations } from "@/lib/translations";
import EmptyState from "@/app/components/EmptyState";
import AdminMessagesPanel from "@/app/components/AdminMessagesPanel";
import OptimizedCarImage from "@/app/components/OptimizedCarImage";

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
  boost_score?: number | null;
  rejection_reason: string | null;
  owner_id: string;
  owner_phone: string | null;
  owner_whatsapp: string | null;
  owner_address: string | null;
  images?: string[] | null;
  listing_type?: string | null;
  created_at?: string | null;
  currency?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  listings_count?: number;
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

function StatCard({
  label,
  value,
  sub,
  highlight,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const className = `card-premium p-3.5 text-left transition ${
    onClick ? "cursor-pointer hover:border-[var(--accent)]/40" : ""
  } ${highlight ? "border-[var(--accent)]/40 bg-[var(--accent-muted)]" : ""}`;
  const inner = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${highlight ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{sub}</p>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

function StatusBadge({ tone, children }: { tone: "live" | "pending" | "draft" | "rejected" | "sold" | "muted"; children: string }) {
  const styles =
    tone === "live"
      ? "bg-emerald-500/15 text-emerald-400"
      : tone === "pending"
        ? "bg-amber-500/15 text-amber-300"
        : tone === "rejected"
          ? "bg-red-500/15 text-red-400"
          : tone === "sold"
            ? "bg-slate-500/25 text-slate-400"
            : tone === "draft"
              ? "bg-slate-500/20 text-slate-300"
              : "bg-[var(--border)] text-[var(--muted-foreground)]";
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${styles}`}>{children}</span>
  );
}

function isPendingCar(c: Car) {
  return !c.is_approved && !c.is_draft && !c.rejection_reason;
}

function isRejectedCar(c: Car) {
  return !c.is_approved && !c.is_draft && !!c.rejection_reason;
}

function isLiveCar(c: Car) {
  return c.is_approved && !c.is_draft && !c.is_sold;
}

function listingTypeLabel(listing_type: string | null | undefined, t: (key: keyof typeof translations.en) => string) {
  if (listing_type === "rent") return t("forRent");
  if (listing_type === "both") return t("saleAndRent");
  return t("forSale");
}

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLocale();
  const toast = useToast();
  const [profile, setProfile] = useState<{ role: string } | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [rdvRequests, setRdvRequests] = useState<RdvRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "rdv" | "sellers" | "messages" | "analytics" | "users" | "traffic">("listings");
  const [rejectModal, setRejectModal] = useState<{ carId: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
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
  const [listingFilter, setListingFilter] = useState<"all" | "pending" | "live" | "drafts" | "rejected" | "sold">("all");
  const [listingSearch, setListingSearch] = useState("");
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [sellersFetchError, setSellersFetchError] = useState<string | null>(null);
  const [setupDismissed, setSetupDismissed] = useState(false);

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

      setAdminListingsError(null);
      let carsList: Car[] = [];
      let profMap: Record<string, Profile> = {};
      try {
        const res = await fetch("/api/admin/cars", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json && Array.isArray(json.cars)) {
          carsList = json.cars as Car[];
          if (json.profiles && typeof json.profiles === "object") {
            profMap = json.profiles as Record<string, Profile>;
          }
        } else {
          const errMsg = (json as { error?: string }).error || `HTTP ${res.status}`;
          setAdminListingsError(errMsg);
        }
      } catch (e) {
        setAdminListingsError(e instanceof Error ? e.message : t("adminNetworkError"));
      }
      setCars(carsList);
      setProfiles(profMap);

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

  useEffect(() => {
    if (activeTab !== "sellers" || !profile) return;
    (async () => {
      setSellersFetchError(null);
      try {
        const res = await fetch("/api/admin/sellers", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json && Array.isArray(json.sellers)) {
          const map: Record<string, Profile> = {};
          (json.sellers as Profile[]).forEach((s) => {
            map[s.id] = s;
          });
          setProfiles(map);
        } else {
          setSellersFetchError((json as { error?: string }).error || t("adminSellersLoadError"));
        }
      } catch (e) {
        setSellersFetchError(e instanceof Error ? e.message : t("adminNetworkError"));
      }
    })();
  }, [activeTab, profile, refreshTrigger, t]);

  async function approveCar(carId: string) {
    const res = await fetch("/api/admin/cars", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: carId, action: "approve" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setCars((prev) =>
      prev.map((c) => (c.id === carId ? { ...c, is_approved: true, is_draft: false, rejection_reason: null } : c))
    );
    setSelectedPendingIds((prev) => prev.filter((id) => id !== carId));
    toast.success(t("adminListingApproved"));
  }

  async function bulkApproveSelected() {
    const ids = selectedPendingIds.filter((id) => {
      const car = cars.find((c) => c.id === id);
      return car && isPendingCar(car);
    });
    if (!ids.length) return;
    const res = await fetch("/api/admin/cars", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk_approve", ids }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setCars((prev) =>
      prev.map((c) =>
        ids.includes(c.id) ? { ...c, is_approved: true, is_draft: false, rejection_reason: null } : c
      )
    );
    setSelectedPendingIds([]);
    toast.success(t("adminListingApproved"));
  }

  function openRejectModal(car: Car) {
    setRejectModal({ carId: car.id, title: car.title });
    setRejectReason(car.rejection_reason ?? "");
  }

  async function submitReject() {
    if (!rejectModal) return;
    const res = await fetch("/api/admin/cars", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: rejectModal.carId,
        action: "reject",
        rejection_reason: rejectReason.trim() || null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setCars((prev) =>
      prev.map((c) =>
        c.id === rejectModal.carId
          ? { ...c, is_approved: false, rejection_reason: rejectReason.trim() || null }
          : c
      )
    );
    setRejectModal(null);
    setRejectReason("");
    toast.success(t("adminListingRejected"));
  }

  async function deleteListing(carId: string) {
    if (!confirm(t("adminDeleteListingConfirm"))) return;
    const res = await fetch(`/api/admin/cars?id=${encodeURIComponent(carId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setCars((prev) => prev.filter((c) => c.id !== carId));
    setSelectedPendingIds((prev) => prev.filter((id) => id !== carId));
    toast.success(t("adminDeleteListing"));
  }

  async function setBoost(carId: string, boost_score: number) {
    const res = await fetch("/api/admin/cars", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: carId, action: "boost", boost_score }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setCars((prev) => prev.map((c) => (c.id === carId ? { ...c, boost_score } : c)));
  }

  async function setSold(carId: string, is_sold: boolean) {
    const res = await fetch("/api/admin/cars", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: carId, action: "sold", is_sold }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setCars((prev) => prev.map((c) => (c.id === carId ? { ...c, is_sold } : c)));
    toast.success(is_sold ? t("sold") : t("approved"));
  }

  async function approveRdv(rdvId: string) {
    const res = await fetch("/api/admin/rdv", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rdvId, action: "approve" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setRdvRequests((prev) => prev.map((r) => (r.id === rdvId ? { ...r, status: "approved" } : r)));
    toast.success(t("adminRdvApproved"));
  }

  async function deleteRdv(rdvId: string) {
    if (!confirm(t("adminRemoveRdvConfirm"))) return;
    const res = await fetch(`/api/admin/rdv?id=${encodeURIComponent(rdvId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setRdvRequests((prev) => prev.filter((r) => r.id !== rdvId));
    toast.success(t("adminRemove"));
  }

  async function updateSellerVerification(
    profileId: string,
    field: "phone_verified" | "id_verified" | "dealer_verified",
    value: boolean
  ) {
    const res = await fetch("/api/admin/sellers", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profileId, [field]: value }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: string }).error || t("adminActionFailed"));
      return;
    }
    setProfiles((prev) => ({
      ...prev,
      [profileId]: { ...prev[profileId], [field]: value },
    }));
    toast.success(t("adminVerifyUpdated"));
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 h-10 w-64 animate-pulse rounded bg-[var(--border)]" />
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]" />
      </div>
    );
  }

  const totalListings = cars.length;
  const approvedListings = cars.filter((c) => c.is_approved && !c.is_draft && !c.is_sold).length;
  const pendingListings = cars.filter((c) => isPendingCar(c)).length;
  const rejectedListings = cars.filter((c) => isRejectedCar(c)).length;
  const soldListings = cars.filter((c) => !!c.is_sold).length;
  const draftListings = cars.filter((c) => c.is_draft).length;
  const uniqueBrands = new Set(profiles ? Object.values(profiles).map((p) => p.company_name).filter(Boolean) : []).size;
  const pendingRdv = rdvRequests.filter((r) => r.status === "pending").length;
  const approvedRdv = rdvRequests.filter((r) => r.status === "approved").length;
  const needsAttention = pendingListings + pendingRdv;

  const pendingCarIds = cars.filter((c) => isPendingCar(c)).map((c) => c.id);
  const allPendingSelected = pendingCarIds.length > 0 && pendingCarIds.every((id) => selectedPendingIds.includes(id));

  const baseFilteredCars =
    listingFilter === "pending"
      ? cars.filter((c) => isPendingCar(c))
      : listingFilter === "live"
        ? cars.filter((c) => isLiveCar(c))
        : listingFilter === "drafts"
          ? cars.filter((c) => !!c.is_draft)
          : listingFilter === "rejected"
            ? cars.filter((c) => isRejectedCar(c))
            : listingFilter === "sold"
              ? cars.filter((c) => !!c.is_sold)
              : cars;

  const searchQ = listingSearch.trim().toLowerCase();
  const filteredCars = searchQ
    ? baseFilteredCars.filter((c) => {
        const brand = profiles[c.owner_id]?.company_name ?? "";
        return [c.title, c.make, c.model, brand].some((field) => field?.toLowerCase().includes(searchQ));
      })
    : baseFilteredCars;

  const tabs: { id: typeof activeTab; label: string; count?: number; badge?: number }[] = [
    { id: "listings", label: t("adminTabListings"), count: totalListings, badge: pendingListings || undefined },
    { id: "rdv", label: t("adminTabRdv"), count: rdvRequests.length, badge: pendingRdv || undefined },
    { id: "sellers", label: t("adminTabSellers"), count: Object.keys(profiles).length },
    { id: "analytics", label: t("adminTabAnalytics") },
    { id: "users", label: t("adminTabUsers") },
    { id: "traffic", label: t("adminTabTraffic") },
    { id: "messages", label: t("adminTabMessages") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] bg-gradient-to-br from-[var(--accent-muted)] via-transparent to-transparent px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-[var(--accent)]">
              <span className="opacity-60">&gt;</span> {t("adminRole")}
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
              {t("adminDashboard")}
            </h1>
            <p className="mt-1.5 max-w-xl text-[12px] text-[var(--muted-foreground)]">{t("adminListingsHelp")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRefreshTrigger((n) => n + 1);
              }}
              className="btn-secondary min-h-10 px-3 text-[12px]"
            >
              {t("adminRefresh")}
            </button>
            <Link href="/dashboard" className="btn-secondary min-h-10 px-3 text-[12px]">
              ← {t("backToDashboard")}
            </Link>
          </div>
        </div>

        {needsAttention > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-3 sm:px-6">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">{t("pending")}</span>
            {pendingListings > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("listings");
                  setListingFilter("pending");
                }}
                className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20"
              >
                {pendingListings} {t("adminAwaitingReview")}
              </button>
            )}
            {pendingRdv > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("rdv")}
                className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200 hover:bg-amber-500/20"
              >
                {pendingRdv} {t("adminRdvPending")}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6 sm:p-4">
          <StatCard
            label={t("adminTotalListings")}
            value={totalListings}
            onClick={() => {
              setActiveTab("listings");
              setListingFilter("all");
            }}
          />
          <StatCard
            label={t("approved")}
            value={approvedListings}
            sub={t("adminLiveOnSite")}
            onClick={() => {
              setActiveTab("listings");
              setListingFilter("live");
            }}
          />
          <StatCard
            label={t("pending")}
            value={pendingListings}
            sub={t("adminAwaitingReview")}
            highlight={pendingListings > 0}
            onClick={() => {
              setActiveTab("listings");
              setListingFilter("pending");
            }}
          />
          <StatCard
            label={t("draftListings")}
            value={draftListings}
            onClick={() => {
              setActiveTab("listings");
              setListingFilter("drafts");
            }}
          />
          <StatCard
            label={t("soldListings")}
            value={soldListings}
            onClick={() => {
              setActiveTab("listings");
              setListingFilter("sold");
            }}
          />
          <StatCard label={t("adminSellerBrands")} value={uniqueBrands} onClick={() => setActiveTab("sellers")} />
          <StatCard
            label={t("adminRdvPending")}
            value={pendingRdv}
            sub={t("adminApprovedCount").replace("{n}", String(approvedRdv))}
            highlight={pendingRdv > 0}
            onClick={() => setActiveTab("rdv")}
          />
        </div>
      </section>

      <div className="mb-5 border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-1 overflow-x-auto pb-px" aria-label="Admin tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[11px] font-medium transition sm:px-4 ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{tab.count}</span>
              )}
              {tab.badge != null && tab.badge > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-black">{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>
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
        <AdminMessagesPanel />
      ) : activeTab === "sellers" ? (
        <>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">
            {t("adminSellersHelp")}
          </p>
          {sellersFetchError && (
            <p className="mb-4 text-[11px] text-red-600 dark:text-red-400">{sellersFetchError}</p>
          )}
          {Object.keys(profiles).length === 0 ? (
            <EmptyState title={t("adminNoSellers")} />
          ) : (
            <ul className="space-y-4">
              {Object.entries(profiles).map(([id, p]) => (
                <li key={id} className="card-premium flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{p.full_name ?? "—"}</p>
                    {p.company_name && (
                      <p className="text-[11px] text-[var(--muted-foreground)]">{p.company_name}</p>
                    )}
                    {p.city && (
                      <p className="text-[10px] text-[var(--muted-foreground)]">{p.city}</p>
                    )}
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {t("phone")}: {p.phone ?? "—"} · {t("whatsapp")}: {p.whatsapp ?? "—"}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {t("adminListingsCount").replace("{n}", String(p.listings_count ?? 0))}
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
            <details className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[11px]">
              <summary className="cursor-pointer font-semibold text-amber-200">{t("adminRdvLoadError")}</summary>
              <p className="mt-2 text-amber-100/90">{rdvFetchError}</p>
              <p className="mt-1 text-amber-100/70">{t("adminRdvEnvHint")}</p>
            </details>
          )}
          {rdvRequests.length === 0 ? (
            <EmptyState title={t("adminNoRdv")} hint={t("adminNoRdvHint")} />
          ) : (
            <ul className="space-y-4">
              {rdvRequests.map((rdv) => {
                const carRel = rdv.cars;
                const carData = Array.isArray(carRel) ? carRel[0] : carRel;
                const matchedCar = cars.find((c) => c.id === rdv.car_id);
                const title = (carData && typeof carData === "object" && carData?.title) ? carData.title : matchedCar?.title ?? t("adminViewListing");
                const intentLabel = rdv.intent === "rent" ? t("adminIntentRent") : rdv.intent === "sale" ? t("adminIntentBuy") : ((carData && "listing_type" in carData) ? (carData.listing_type === "rent" ? t("adminIntentRent") : t("adminIntentBuy")) : null);
                const ownerId = (carData && typeof carData === "object" && "owner_id" in carData) ? (carData as { owner_id?: string }).owner_id : matchedCar?.owner_id ?? null;
                const sellerProfile = ownerId ? profiles[ownerId] : null;
                const brand = sellerProfile?.company_name ?? sellerProfile?.full_name ?? "—";
                const ownerPhone =
                  (carData && typeof carData === "object" && "owner_phone" in carData && (carData as { owner_phone?: string }).owner_phone)
                  ?? matchedCar?.owner_phone;
                const ownerWhatsapp =
                  (carData && typeof carData === "object" && "owner_whatsapp" in carData && (carData as { owner_whatsapp?: string }).owner_whatsapp)
                  ?? matchedCar?.owner_whatsapp;
                const ownerAddress =
                  (carData && typeof carData === "object" && "owner_address" in carData && (carData as { owner_address?: string }).owner_address)
                  ?? matchedCar?.owner_address;
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
          {adminListingsError && !setupDismissed && (
            <div className="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-[11px]">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-amber-200">{t("adminSetupRequired")}</p>
                <button
                  type="button"
                  className="shrink-0 text-[12px] text-amber-100/60 hover:text-amber-100"
                  aria-label="Dismiss"
                  onClick={() => setSetupDismissed(true)}
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 leading-relaxed text-amber-100/85">{adminListingsError}</p>
              <p className="mt-1 text-amber-100/70">{t("adminRdvEnvHint")}</p>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3">
            <input
              type="search"
              value={listingSearch}
              onChange={(e) => setListingSearch(e.target.value)}
              placeholder={t("adminSearchListings")}
              className="input-premium w-full max-w-md text-[12px]"
            />
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "all" as const, label: t("adminTotalListings"), n: totalListings },
                  { id: "pending" as const, label: t("pending"), n: pendingListings },
                  { id: "live" as const, label: t("approved"), n: approvedListings },
                  { id: "rejected" as const, label: t("adminRejected"), n: rejectedListings },
                  { id: "sold" as const, label: t("soldListings"), n: soldListings },
                  { id: "drafts" as const, label: t("draftListings"), n: draftListings },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setListingFilter(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    listingFilter === f.id
                      ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
                  }`}
                >
                  {f.label} <span className="font-mono opacity-80">{f.n}</span>
                </button>
              ))}
            </div>
            {pendingCarIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={() => {
                      if (allPendingSelected) setSelectedPendingIds([]);
                      else setSelectedPendingIds(pendingCarIds);
                    }}
                    className="rounded border-[var(--border)]"
                  />
                  {t("adminSelectPending")}
                </label>
                {selectedPendingIds.length > 0 && (
                  <button
                    type="button"
                    onClick={bulkApproveSelected}
                    className="btn-primary py-1.5 text-[11px]"
                  >
                    {t("adminBulkApprove")} ({selectedPendingIds.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {filteredCars.length === 0 ? (
            <EmptyState
              title={t("adminNoListings")}
              hint={adminListingsError ? t("adminRdvEnvHint") : t("adminListingsHelp")}
              actionLabel={t("adminRefresh")}
              onAction={() => {
                setLoading(true);
                setRefreshTrigger((n) => n + 1);
              }}
            />
          ) : (
            <ul className="space-y-3">
              {filteredCars.map((car) => {
                const seller = profiles[car.owner_id];
                const brand = seller?.company_name ?? seller?.full_name ?? "—";
                const statusTone = car.is_sold
                  ? "sold"
                  : car.is_draft
                    ? "draft"
                    : car.is_approved
                      ? "live"
                      : car.rejection_reason
                        ? "rejected"
                        : "pending";
                const statusLabel = car.is_sold
                  ? t("sold")
                  : car.is_draft
                    ? t("draft")
                    : car.is_approved
                      ? t("approved")
                      : car.rejection_reason
                        ? t("adminRejected")
                        : t("pending");
                const thumb = car.images?.[0];
                const carPending = isPendingCar(car);
                return (
                  <li key={car.id} className="card-premium p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 gap-3">
                        {carPending && (
                          <input
                            type="checkbox"
                            checked={selectedPendingIds.includes(car.id)}
                            onChange={() => {
                              setSelectedPendingIds((prev) =>
                                prev.includes(car.id) ? prev.filter((id) => id !== car.id) : [...prev, car.id]
                              );
                            }}
                            className="mt-1 shrink-0 rounded border-[var(--border)]"
                            aria-label={t("adminSelectPending")}
                          />
                        )}
                        {thumb && (
                          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--background)]">
                            <OptimizedCarImage src={thumb} alt={car.title} sizes="96px" thumbWidth={192} quality={70} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--foreground)]">{car.title}</p>
                            <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                            {car.listing_type && (
                              <StatusBadge tone="muted">{listingTypeLabel(car.listing_type, t)}</StatusBadge>
                            )}
                            {(car.boost_score ?? 0) > 0 && (
                              <StatusBadge tone="muted">{t("adminBoostN").replace("{n}", String(car.boost_score))}</StatusBadge>
                            )}
                          </div>
                          <p className="mt-1 text-caption text-[var(--muted-foreground)]">
                            {car.make} {car.model}
                            {car.year != null ? ` · ${car.year}` : ""} · {formatPrice(car.price, "USD", car.currency ?? "USD")}
                          </p>
                          {car.created_at && (
                            <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                              {new Date(car.created_at).toLocaleDateString()}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                            {t("adminBrandLabel")} {brand}
                          </p>
                          {car.rejection_reason && (
                            <p className="mt-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-300">
                              {car.rejection_reason}
                            </p>
                          )}
                          <div className="mt-2 grid gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)]/60 p-2.5 text-[10px] sm:grid-cols-3">
                            <p>
                              {t("phone")}: {car.owner_phone ?? "—"}
                            </p>
                            <p>
                              {t("whatsapp")}: {car.owner_whatsapp ?? "—"}
                            </p>
                            <p>
                              {t("address")}: {car.owner_address ?? "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={car.boost_score ?? 0}
                          onChange={(e) => setBoost(car.id, parseInt(e.target.value, 10))}
                          className="min-h-9 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-[10px] text-[var(--foreground)]"
                          title={t("adminBoostTitle")}
                        >
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n === 0 ? t("adminNoBoost") : t("adminBoostN").replace("{n}", String(n))}
                            </option>
                          ))}
                        </select>
                        <Link
                          href={`/cars/${car.id}?preview=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary min-h-9 px-3 text-[10px]"
                        >
                          {t("adminPreview")}
                        </Link>
                        {car.is_approved && !car.is_draft && (
                          <button
                            type="button"
                            onClick={() => setSold(car.id, !car.is_sold)}
                            className="min-h-9 rounded border border-[var(--border)] px-3 py-1.5 text-[10px] font-medium text-[var(--muted-foreground)] hover:bg-[var(--border)]/50"
                          >
                            {car.is_sold ? t("approved") : t("markAsSold")}
                          </button>
                        )}
                        {car.is_approved ? (
                          <button
                            type="button"
                            onClick={() => openRejectModal(car)}
                            className="min-h-9 rounded border border-amber-500/50 px-3 py-1.5 text-[10px] font-medium text-amber-300 hover:bg-amber-500/10"
                          >
                            {t("adminReject")}
                          </button>
                        ) : (
                          carPending && (
                            <button type="button" onClick={() => approveCar(car.id)} className="btn-primary min-h-9 py-1.5 text-[10px]">
                              {t("adminApprove")}
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => deleteListing(car.id)}
                          className="min-h-9 rounded border border-red-500/40 px-3 py-1.5 text-[10px] font-medium text-red-400 hover:bg-red-500/10"
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
