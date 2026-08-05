"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/app/contexts/LocaleContext";
import { SUPPORT_EMAIL, SITE_URL, LISTING_TYPE_TRANSLATION_KEYS } from "@/lib/constants";
import { formatPrice } from "@/lib/format-utils";
import {
  syncSellerProfileFromAuth,
  sellerDisplayName,
  isCompanySeller,
} from "@/lib/seller-profile";
import FirstVisitTips, { type TourStep } from "@/app/components/FirstVisitTips";
import EmptyState from "@/app/components/EmptyState";
import PlatformMessagesInbox from "@/app/components/PlatformMessagesInbox";

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  company_name: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  avatar_url?: string | null;
};

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
  images?: string[] | null;
};

type ApprovedRdv = {
  id: string;
  car_id: string;
  intent?: string | null;
  created_at: string;
  suggested_price: number | null;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  preferred_date?: string | null;
  message?: string | null;
  cars: { title?: string; listing_type?: string } | null;
};

type ListingFilter = "all" | "live" | "pending" | "draft" | "sold";

function isVerified(user: { email_confirmed_at?: string | null } | null): boolean {
  return !!user?.email_confirmed_at;
}

function formatPhoneDisplay(phone: string | null | undefined) {
  const d = (phone ?? "").replace(/\D/g, "");
  if (d.length < 9) return null;
  if (d.startsWith("243") && d.length >= 12) return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return `+${d}`;
}

function phoneDigits(phone: string | null | undefined) {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d : null;
}

function whatsappHref(phone: string | null | undefined, text?: string) {
  const d = phoneDigits(phone);
  if (!d) return null;
  const intl = d.startsWith("0") ? `243${d.slice(1)}` : d;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${intl}${q}`;
}

function StatTile({
  label,
  value,
  hint,
  accent,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  const className = `rounded-lg border p-3 sm:p-4 transition ${
    accent
      ? "border-[var(--accent)]/40 bg-[var(--accent-muted)]"
      : "border-[var(--border)] bg-[var(--card)]"
  } ${onClick ? "cursor-pointer hover:border-[var(--accent)]/50" : ""}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-1.5 font-mono text-xl font-bold tabular-nums sm:text-2xl ${accent ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
          {value}
        </p>
        {hint && <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{hint}</p>}
      </button>
    );
  }
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-1.5 font-mono text-xl font-bold tabular-nums sm:text-2xl ${accent ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<{ id?: string; email_confirmed_at?: string | null; email?: string | null } | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [approvedRdv, setApprovedRdv] = useState<ApprovedRdv[]>([]);
  const [stats, setStats] = useState<Record<string, { views: number; favorites: number; unlocks: number; rdv: number }>>({});
  const [adminMessages, setAdminMessages] = useState<{ id: string; subject: string; body: string; created_at: string }[]>([]);
  const [notifications, setNotifications] = useState<
    { id: string; type: string; car_id: string | null; title: string; body: string | null; read_at: string | null; created_at: string }[]
  >([]);
  const [dismissedMsgIds, setDismissedMsgIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("dismissed_admin_messages");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  });
  const [dismissedRdvIds, setDismissedRdvIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("dismissed_seller_rdv");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "rdv">("overview");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [openMoreId, setOpenMoreId] = useState<string | null>(null);

  const visibleAdminMessages = adminMessages.filter((m) => !dismissedMsgIds.has(m.id));
  const visibleApprovedRdv = approvedRdv.filter((r) => !dismissedRdvIds.has(r.id));

  function dismissAdminMessage(msgId: string) {
    setDismissedMsgIds((prev) => {
      const next = new Set(prev);
      next.add(msgId);
      try {
        localStorage.setItem("dismissed_admin_messages", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function clearAllAdminMessages() {
    setDismissedMsgIds((prev) => {
      const next = new Set([...prev, ...adminMessages.map((m) => m.id)]);
      try {
        localStorage.setItem("dismissed_admin_messages", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function dismissRdv(rdvId: string) {
    setDismissedRdvIds((prev) => {
      const next = new Set(prev);
      next.add(rdvId);
      try {
        localStorage.setItem("dismissed_seller_rdv", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function clearAllRdv() {
    setDismissedRdvIds((prev) => {
      const next = new Set([...prev, ...approvedRdv.map((r) => r.id)]);
      try {
        localStorage.setItem("dismissed_seller_rdv", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  async function dismissNotification(notifId: string) {
    if (!user) return;
    await supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", notifId).eq("user_id", user.id);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  async function clearAllNotifications() {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read_at);
    await Promise.all(
      unread.map((n) =>
        supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id).eq("user_id", user.id)
      )
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login?next=/dashboard/seller");
        return;
      }
      setUser(u);

      const profileData = await syncSellerProfileFromAuth(supabase, u);
      setProfile(profileData);

      if (profileData.role !== "seller" && profileData.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      const { data: carsData } = await supabase
        .from("cars")
        .select("id, title, price, make, model, year, is_approved, is_draft, is_sold, rejection_reason, created_at, images")
        .eq("owner_id", u.id)
        .order("created_at", { ascending: false });
      const list = (carsData as Car[]) ?? [];
      setCars(list);

      if (list.length > 0) {
        const ids = list.map((c) => c.id);
        const { data: rdvData } = await supabase
          .from("rendezvous_requests")
          .select(
            "id, car_id, intent, created_at, suggested_price, buyer_name, buyer_phone, buyer_email, preferred_date, message, cars(title, listing_type)"
          )
          .eq("status", "approved")
          .in("car_id", ids)
          .order("created_at", { ascending: false });
        setApprovedRdv((rdvData as unknown as ApprovedRdv[]) ?? []);

        const [{ data: viewsData }, { data: favData }, { data: unlockData }, { data: rdvDataAll }] = await Promise.all([
          supabase.from("car_views").select("car_id").in("car_id", ids),
          supabase.from("favorites").select("car_id").in("car_id", ids),
          supabase.from("contact_unlocks").select("car_id").in("car_id", ids),
          supabase.from("rendezvous_requests").select("car_id").eq("status", "approved").in("car_id", ids),
        ]);
        const byCar: Record<string, { views: number; favorites: number; unlocks: number; rdv: number }> = {};
        ids.forEach((id) => {
          byCar[id] = { views: 0, favorites: 0, unlocks: 0, rdv: 0 };
        });
        (viewsData ?? []).forEach((r: { car_id?: string }) => {
          if (r.car_id && byCar[r.car_id]) byCar[r.car_id].views++;
        });
        (favData ?? []).forEach((r: { car_id?: string }) => {
          if (r.car_id && byCar[r.car_id]) byCar[r.car_id].favorites++;
        });
        (unlockData ?? []).forEach((r: { car_id?: string }) => {
          if (r.car_id && byCar[r.car_id]) byCar[r.car_id].unlocks++;
        });
        (rdvDataAll ?? []).forEach((r: { car_id?: string }) => {
          if (r.car_id && byCar[r.car_id]) byCar[r.car_id].rdv++;
        });
        setStats(byCar);
      }

      const { data: msgData } = await supabase
        .from("admin_messages")
        .select("id, subject, body, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setAdminMessages((msgData ?? []) as { id: string; subject: string; body: string; created_at: string }[]);

      const { data: notifData } = await supabase
        .from("user_notifications")
        .select("id, type, car_id, title, body, read_at, created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(
        (notifData ?? []) as {
          id: string;
          type: string;
          car_id: string | null;
          title: string;
          body: string | null;
          read_at: string | null;
          created_at: string;
        }[]
      );

      // Deep-link unread RDV approvals to the RDV tab
      const hasUnreadRdv = (notifData ?? []).some(
        (n: { type?: string; read_at?: string | null }) => n.type === "rdv_approved" && !n.read_at
      );
      if (hasUnreadRdv) {
        setActiveTab("rdv");
      }

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

  const metrics = useMemo(() => {
    const live = cars.filter((c) => c.is_approved && !c.is_draft && !c.is_sold).length;
    const pending = cars.filter((c) => !c.is_approved && !c.is_draft && !c.is_sold).length;
    const drafts = cars.filter((c) => c.is_draft).length;
    const sold = cars.filter((c) => c.is_sold).length;
    const views = Object.values(stats).reduce((a, s) => a + s.views, 0);
    const favorites = Object.values(stats).reduce((a, s) => a + s.favorites, 0);
    const unlocks = Object.values(stats).reduce((a, s) => a + s.unlocks, 0);
    const rdv = Object.values(stats).reduce((a, s) => a + s.rdv, 0);
    const interest = favorites + unlocks + rdv;
    return { live, pending, drafts, sold, views, favorites, unlocks, rdv, interest };
  }, [cars, stats]);

  const topListings = useMemo(() => {
    return [...cars]
      .filter((c) => !c.is_draft)
      .map((c) => ({
        car: c,
        score: (stats[c.id]?.views ?? 0) + (stats[c.id]?.favorites ?? 0) * 3 + (stats[c.id]?.unlocks ?? 0) * 5 + (stats[c.id]?.rdv ?? 0) * 5,
        ...stats[c.id],
      }))
      .filter((x) => (x.views ?? 0) > 0 || (x.favorites ?? 0) > 0 || (x.unlocks ?? 0) > 0 || (x.rdv ?? 0) > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [cars, stats]);

  const filteredCars = useMemo(() => {
    switch (listingFilter) {
      case "live":
        return cars.filter((c) => c.is_approved && !c.is_draft && !c.is_sold);
      case "pending":
        return cars.filter((c) => !c.is_approved && !c.is_draft && !c.is_sold);
      case "draft":
        return cars.filter((c) => c.is_draft);
      case "sold":
        return cars.filter((c) => c.is_sold);
      default:
        return cars;
    }
  }, [cars, listingFilter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-body text-[var(--muted-foreground)]">{t("loading")}</p>
      </div>
    );
  }

  const hasContact = !!(profile?.phone && profile.phone.replace(/\D/g, "").length >= 9);
  const canListCars = isVerified(user);
  const displayName = profile ? sellerDisplayName(profile) : "";
  const company = profile ? isCompanySeller(profile) : false;
  const phoneLabel = formatPhoneDisplay(profile?.phone);
  const hasDisplayName = !!(profile?.company_name?.trim() || profile?.full_name?.trim());
  const hasListing = cars.length > 0;
  const setupItems = [
    { done: canListCars, label: t("setupEmail"), href: "/dashboard/settings" },
    { done: hasContact, label: t("setupPhone"), href: "/dashboard/settings" },
    { done: hasDisplayName, label: t("setupBrand"), href: "/dashboard/settings" },
    { done: hasListing, label: t("setupListing"), href: "/dashboard/cars/new" },
  ];
  const setupIncomplete = setupItems.some((i) => !i.done);
  const storefrontUrl = profile ? `${SITE_URL}/seller/${profile.id}` : SITE_URL;
  const shareText = encodeURIComponent(
    `${displayName} — ${metrics.live} ${t("liveListings").toLowerCase()} · DRCCARS: ${storefrontUrl}`
  );

  const tourSteps: TourStep[] = [
    { targetId: "seller-tip-add-car", messageKey: "tipSellerAddCar" },
    ...(setupIncomplete
      ? [{ targetId: "seller-tip-checklist", messageKey: "tipSellerChecklist" as const }]
      : []),
    { targetId: "seller-tip-tabs", messageKey: "tipSellerTabs" },
    { targetId: "seller-tip-storefront", messageKey: "tipSellerStorefront" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <FirstVisitTips storageKey="seller-dashboard-tips-seen" steps={tourSteps} />
      {/* Header */}
      <section className="mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="relative border-b border-[var(--border)] bg-gradient-to-br from-[var(--accent-muted)] via-transparent to-transparent px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--background)] text-lg font-bold text-[var(--accent)]">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (displayName[0] || "?").toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-[var(--muted-foreground)]">
                  {t("sellerWelcome")}
                  {user?.email ? ` · ${user.email}` : ""}
                </p>
                <h1 className="truncate font-mono text-xl font-bold text-[var(--foreground)] sm:text-2xl">{displayName}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                    {company ? t("sellerCompany") : t("sellerIndividual")}
                  </span>
                  {profile?.city && (
                    <span className="text-[10px] text-[var(--muted-foreground)]">{profile.city}</span>
                  )}
                  {phoneLabel ? (
                    <span className="text-[10px] font-mono text-[var(--accent)]">
                      {t("phoneOnFile")}: {phoneLabel}
                    </span>
                  ) : (
                    <Link href="/dashboard/settings" className="text-[10px] text-amber-400 hover:underline">
                      {t("addPhoneHint")}
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canListCars ? (
                <Link id="seller-tip-add-car" href="/dashboard/cars/new" className="btn-primary min-h-10 px-4 py-2 text-sm">
                  {t("addCar")}
                </Link>
              ) : (
                <Link id="seller-tip-add-car" href="/dashboard/cars/new" className="btn-secondary min-h-10 px-4 py-2 text-sm">
                  {t("addCarVerifyFirst")}
                </Link>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHeaderMenuOpen((o) => !o)}
                  className="btn-secondary min-h-10 px-3 py-2 text-sm sm:hidden"
                  aria-expanded={headerMenuOpen}
                  aria-label={t("sellerMenuMore")}
                >
                  {t("sellerMenuMore")}
                </button>
                <div className={`flex-wrap gap-2 ${headerMenuOpen ? "mt-2 flex w-full flex-col sm:mt-0 sm:flex sm:w-auto sm:flex-row" : "hidden sm:flex"}`}>
                  <Link
                    id="seller-tip-storefront"
                    href={profile ? `/seller/${profile.id}` : "#"}
                    className="btn-secondary min-h-10 px-4 py-2 text-sm sm:hidden"
                  >
                    {t("viewStorefront")}
                  </Link>
                  <Link href="/dashboard/settings" className="btn-secondary min-h-10 px-4 py-2 text-sm">
                    {t("editProfile")}
                  </Link>
                  <Link
                    href="/dashboard/seller/welcome"
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    {t("howItWorks")}
                  </Link>
                  <a
                    href="/DRCCARS-Guide-Vendeur.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    {t("downloadSellerGuide")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden gap-2 border-b border-[var(--border)] p-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:p-4">
          <Link
            href={profile ? `/seller/${profile.id}` : "#"}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            {t("viewStorefront")}
          </Link>
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            {t("shareStorefront")}
          </a>
          <button
            type="button"
            onClick={() => setActiveTab("rdv")}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            {t("tabRendezVous")} ({visibleApprovedRdv.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setListingFilter("live");
              setActiveTab("listings");
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-center text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            {t("tabListings")} ({cars.length})
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div id="seller-tip-tabs" className="mb-6 border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
          {(["overview", "listings", "rdv"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 border-b-2 px-3 py-3 text-caption font-medium transition-colors sm:px-4 ${
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab === "overview" ? t("tabOverview") : tab === "listings" ? t("tabListings") : t("tabRendezVous")}
              {tab === "rdv" && visibleApprovedRdv.length > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent-foreground)]">
                  {visibleApprovedRdv.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {visibleApprovedRdv.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("rdv")}
              className="w-full rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-muted)] px-4 py-3 text-left"
            >
              <p className="text-sm font-semibold text-[var(--accent)]">{t("rdvBannerTitle")}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                {t("rdvBannerBody").replace("{n}", String(visibleApprovedRdv.length))}
              </p>
            </button>
          )}

          {notifications.length > 0 && (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {t("notifications")}
                </h2>
                {notifications.some((n) => !n.read_at) && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {t("clearAll")}
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start justify-between gap-2 rounded-lg border p-3 ${
                      n.read_at
                        ? "border-[var(--border)] bg-[var(--background)] opacity-75"
                        : "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                    }`}
                  >
                    <div className="min-w-0">
                      {n.type === "rdv_approved" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("rdv");
                            if (!n.read_at) dismissNotification(n.id);
                          }}
                          className="text-left font-semibold text-[var(--foreground)] hover:underline"
                        >
                          {n.title}
                        </button>
                      ) : n.car_id ? (
                        <Link href={`/cars/${n.car_id}`} className="font-semibold text-[var(--foreground)] hover:underline">
                          {n.title}
                        </Link>
                      ) : (
                        <p className="font-semibold text-[var(--foreground)]">{n.title}</p>
                      )}
                      {n.body && <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.read_at && (
                      <button
                        type="button"
                        onClick={() => dismissNotification(n.id)}
                        className="shrink-0 text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        {t("dismiss")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {setupIncomplete && (
            <section id="seller-tip-checklist" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
              <h2 className="text-subheading text-amber-200">{t("setupChecklist")}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {setupItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition ${
                        item.done
                          ? "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]"
                          : "border-amber-500/40 bg-[var(--background)] text-[var(--foreground)] hover:border-amber-400"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          item.done ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {item.done ? "✓" : "!"}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visibleAdminMessages.length > 0 && (
            <PlatformMessagesInbox
              messages={visibleAdminMessages}
              onDismiss={dismissAdminMessage}
              onClearAll={clearAllAdminMessages}
            />
          )}

          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("inventoryOverview")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                label={t("liveListings")}
                value={metrics.live}
                accent
                onClick={() => {
                  setListingFilter("live");
                  setActiveTab("listings");
                }}
              />
              <StatTile
                label={t("pendingListings")}
                value={metrics.pending}
                onClick={() => {
                  setListingFilter("pending");
                  setActiveTab("listings");
                }}
              />
              <StatTile
                label={t("draftListings")}
                value={metrics.drafts}
                onClick={() => {
                  setListingFilter("draft");
                  setActiveTab("listings");
                }}
              />
              <StatTile
                label={t("soldListings")}
                value={metrics.sold}
                onClick={() => {
                  setListingFilter("sold");
                  setActiveTab("listings");
                }}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {t("performanceOverview")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label={t("totalViews")} value={metrics.views} />
              <StatTile label={t("favoritesStat")} value={metrics.favorites} />
              <StatTile label={t("contactUnlocksStat")} value={metrics.unlocks} />
              <StatTile
                label={t("approvedRdv")}
                value={metrics.rdv}
                accent={metrics.rdv > 0}
                onClick={() => setActiveTab("rdv")}
              />
            </div>
            <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
              {t("interestScore")}: <span className="font-mono font-semibold text-[var(--foreground)]">{metrics.interest}</span>
              {" · "}
              {t("favoritesStat")} + {t("contactUnlocksStat")} + {t("approvedRdv")}
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{t("topListings")}</h2>
              <button type="button" onClick={() => setActiveTab("listings")} className="text-[10px] font-medium text-[var(--accent)] hover:underline">
                {t("tabListings")} →
              </button>
            </div>
            {topListings.length === 0 ? (
              <EmptyState title={t("noTopListingsYet")} hint={t("emptyTopListingsHint")} />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {topListings.map(({ car, views = 0, favorites = 0, unlocks = 0, rdv = 0 }) => (
                  <li key={car.id} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-[var(--border)]">
                      {car.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={car.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/cars/${car.id}`} className="line-clamp-1 text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                        {car.title}
                      </Link>
                      <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{formatPrice(car.price, "USD", "USD")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-[var(--muted-foreground)]">
                        <span>{t("viewsLabel")} {views}</span>
                        <span>{t("favoritesLabel")} {favorites}</span>
                        <span>{t("unlocksLabel")} {unlocks}</span>
                        <span>{t("rdvLabel")} {rdv}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {activeTab === "rdv" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-body font-semibold text-[var(--foreground)]">{t("approvedRendezvous")}</h2>
            {visibleApprovedRdv.length > 0 && (
              <button type="button" onClick={clearAllRdv} className="text-[10px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                {t("clearAll")}
              </button>
            )}
          </div>
          <p className="mb-4 text-caption text-[var(--muted-foreground)]">{t("rdvHelpSeller")}</p>
          {visibleApprovedRdv.length === 0 ? (
            <EmptyState title={t("noApprovedRdv")} hint={t("noApprovedRdvHint")} />
          ) : (
            <ul className="space-y-3">
              {visibleApprovedRdv.map((rdv) => {
                const carObj = rdv.cars && typeof rdv.cars === "object" ? rdv.cars : null;
                const title = carObj?.title ?? "Car";
                const carRow = cars.find((c) => c.id === rdv.car_id);
                const intentLabel =
                  rdv.intent === "rent"
                    ? t(LISTING_TYPE_TRANSLATION_KEYS.rent as Parameters<typeof t>[0])
                    : rdv.intent === "sale"
                      ? t(LISTING_TYPE_TRANSLATION_KEYS.sale as Parameters<typeof t>[0])
                      : null;
                const phone = phoneDigits(rdv.buyer_phone);
                const wa = whatsappHref(
                  rdv.buyer_phone,
                  t("whatsappBuyerInterest").replace("{title}", title)
                );
                return (
                  <li key={rdv.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/cars/${rdv.car_id}`} className="text-sm font-semibold text-[var(--foreground)] hover:underline">
                            {title}
                          </Link>
                          {intentLabel && (
                            <span className="rounded bg-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">{intentLabel}</span>
                          )}
                          {carRow?.is_sold && (
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">{t("sold")}</span>
                          )}
                        </div>
                        {(rdv.buyer_name || rdv.buyer_email) && (
                          <p className="mt-1.5 text-[12px] font-medium text-[var(--foreground)]">
                            {rdv.buyer_name || rdv.buyer_email}
                          </p>
                        )}
                        {rdv.preferred_date && (
                          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                            {t("preferredDate")}:{" "}
                            <span className="font-medium text-[var(--foreground)]">
                              {new Date(rdv.preferred_date).toLocaleString()}
                            </span>
                          </p>
                        )}
                        {rdv.suggested_price != null && rdv.suggested_price > 0 && (
                          <p className="mt-1 text-[11px] font-medium text-[var(--accent)]">
                            {t("buyerOffer")} {formatPrice(rdv.suggested_price, "USD", null)}
                          </p>
                        )}
                        {rdv.message && (
                          <p className="mt-1.5 line-clamp-3 text-[11px] text-[var(--muted-foreground)]">{rdv.message}</p>
                        )}
                        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                          {t("requestedOn")} {new Date(rdv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {phone && (
                        <a
                          href={`tel:+${phone.startsWith("0") ? `243${phone.slice(1)}` : phone}`}
                          className="btn-secondary min-h-10 flex-1 justify-center text-center text-xs sm:flex-none"
                        >
                          {t("callBuyer")}
                        </a>
                      )}
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary min-h-10 flex-1 justify-center text-center text-xs sm:flex-none"
                        >
                          {t("whatsappBuyer")}
                        </a>
                      )}
                      <Link
                        href={`/cars/${rdv.car_id}`}
                        className="btn-secondary min-h-10 flex-1 justify-center text-center text-xs sm:flex-none"
                      >
                        {t("view")}
                      </Link>
                      {!carRow?.is_sold && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsSold(rdv.car_id)}
                          className="min-h-10 flex-1 rounded border border-emerald-500/40 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 sm:flex-none"
                        >
                          {t("markAsSold")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => dismissRdv(rdv.id)}
                        className="min-h-10 text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:ml-auto"
                      >
                        {t("dismiss")}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {activeTab === "listings" && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {(
                [
                  ["all", t("allListingsFilter"), cars.length],
                  ["live", t("liveListings"), metrics.live],
                  ["pending", t("pendingListings"), metrics.pending],
                  ["draft", t("draftListings"), metrics.drafts],
                  ["sold", t("soldListings"), metrics.sold],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setListingFilter(key)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    listingFilter === key
                      ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            {canListCars ? (
              <Link href="/dashboard/cars/new" className="btn-primary shrink-0 px-4 py-2 text-sm">
                {t("addCar")}
              </Link>
            ) : (
              <Link href="/dashboard/cars/new" className="btn-secondary shrink-0 px-4 py-2 text-sm">
                {t("addCarVerifyFirst")}
              </Link>
            )}
          </div>

          {filteredCars.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
              <p className="text-body text-[var(--muted-foreground)]">{t("noListingsYetAdd")}</p>
              <Link href="/dashboard/cars/new" className="btn-primary">
                {t("addCar")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredCars.map((car) => {
                const nextStep = car.is_sold
                  ? t("listingNextSold")
                  : car.is_draft
                    ? t("listingNextDraft")
                    : car.is_approved
                      ? (stats[car.id]?.rdv ?? 0) > 0
                        ? t("listingNextLiveRdv")
                        : t("listingNextLive")
                      : t("listingNextPending");
                return (
                  <li key={car.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
                    <div className="flex gap-3">
                      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--border)] sm:h-16 sm:w-20">
                        {car.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={car.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-semibold text-[var(--foreground)]">{car.title}</p>
                        <p className="text-small text-[var(--muted-foreground)]">
                          {car.make} {car.model}
                          {car.year != null ? ` · ${car.year}` : ""} · {formatPrice(car.price, "USD", "USD")}
                        </p>
                        <span
                          className={`mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                            car.is_sold
                              ? "bg-emerald-500/15 text-emerald-400"
                              : car.is_draft
                                ? "bg-slate-500/20 text-slate-300"
                                : car.is_approved
                                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                                  : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {car.is_sold ? t("sold") : car.is_draft ? t("draft") : car.is_approved ? t("approved") : t("pendingApproval")}
                        </span>
                        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{nextStep}</p>
                        {!car.is_draft && !car.is_approved && car.rejection_reason && (
                          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-caption text-amber-100">
                            <p className="font-medium">
                              {t("rejectionReason")}: {car.rejection_reason}
                            </p>
                            <a
                              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Re: Listing - ${car.title}`)}`}
                              className="mt-1 inline-block text-[10px] font-medium text-amber-300 underline"
                            >
                              {t("reachOut")} →
                            </a>
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[var(--muted-foreground)]">
                          <span>
                            {t("viewsLabel")} <span className="font-semibold text-[var(--foreground)]">{stats[car.id]?.views ?? 0}</span>
                          </span>
                          <span>
                            {t("rdvLabel")} <span className="font-semibold text-[var(--foreground)]">{stats[car.id]?.rdv ?? 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Link href={`/dashboard/cars/${car.id}/edit`} className="btn-secondary min-h-10 flex-1 justify-center text-center text-xs sm:flex-none">
                        {t("edit")}
                      </Link>
                      {!car.is_sold && car.is_approved && !car.is_draft && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsSold(car.id)}
                          className="min-h-10 flex-1 rounded border border-emerald-500/40 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 sm:flex-none"
                        >
                          {t("markAsSold")}
                        </button>
                      )}
                      {car.is_sold && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsAvailable(car.id)}
                          className="min-h-10 flex-1 rounded border border-emerald-500/40 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 sm:flex-none"
                        >
                          {t("markAsAvailable")}
                        </button>
                      )}
                      <div className="relative sm:ml-auto">
                        <button
                          type="button"
                          onClick={() => setOpenMoreId(openMoreId === car.id ? null : car.id)}
                          className="min-h-10 w-full rounded border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:w-auto"
                        >
                          {t("moreActions")}
                        </button>
                        {openMoreId === car.id && (
                          <div className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMoreId(null);
                                handleDelete(car.id);
                              }}
                              className="w-full rounded px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10"
                            >
                              {t("adminDeleteListing")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
