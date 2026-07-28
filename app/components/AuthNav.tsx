"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useLocale } from "@/app/contexts/LocaleContext";
import { readGuestFavorites, GUEST_FAVORITES_KEY } from "@/lib/guest-favorites";

type Props = { mobile?: boolean; onNavigate?: () => void };

export default function AuthNav({ mobile, onNavigate }: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadFavCount() {
      const local = readGuestFavorites().length;
      if (!user) {
        if (!cancelled) setFavCount(local);
        return;
      }
      try {
        const res = await fetch("/api/favorites", { credentials: "include" });
        const data = await res.json();
        const serverIds = ((data.carIds ?? []) as string[]).filter(Boolean);
        if (!cancelled) setFavCount(new Set([...serverIds, ...readGuestFavorites()]).size);
      } catch {
        if (!cancelled) setFavCount(local);
      }
    }
    loadFavCount();
    function onStorage(e: StorageEvent) {
      if (e.key === GUEST_FAVORITES_KEY || e.key === null) loadFavCount();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUserName(null);
      setAvatarUrl(null);
      return;
    }
    const meta = user.user_metadata as { full_name?: string } | undefined;
    if (meta?.full_name && typeof meta.full_name === "string") {
      setUserName(meta.full_name.trim() || null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (!cancelled) {
          const row = data as { full_name?: string | null; avatar_url?: string | null } | null;
          const name = row?.full_name;
          setUserName(name && typeof name === "string" ? name.trim() : null);
          setAvatarUrl(row?.avatar_url ?? null);
        }
      } catch {
        if (!cancelled) {
          setUserName(null);
          setAvatarUrl(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [userMenuOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    onNavigate?.();
    router.push("/");
    router.refresh();
  }

  const linkClass = `text-[11px] font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors ${mobile ? "mobile-nav-link mobile-nav-link-muted px-0" : ""}`;

  const favoritesLink = (
    <Link href="/favorites" onClick={onNavigate} className={`${linkClass} inline-flex items-center gap-2`}>
      <span>{t("myFavorites")}</span>
      {favCount > 0 && (
        <span className="rounded-[var(--radius)] bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[var(--accent-foreground)]">
          {favCount > 99 ? "99+" : favCount}
        </span>
      )}
    </Link>
  );

  if (!user) {
    return (
      <nav className={mobile ? "flex flex-col gap-1" : "flex items-center gap-5"}>
        {favoritesLink}
        <Link href="/login" onClick={onNavigate} className={linkClass}>
          {t("logIn")}
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className={
            mobile
              ? "mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_8px_28px_var(--accent-glow)] transition-transform active:scale-[0.98]"
              : "btn-accent inline-flex py-2 px-4 text-[11px] font-semibold"
          }
        >
          {t("signUp")}
        </Link>
      </nav>
    );
  }

  if (mobile) {
    return (
      <nav className="flex flex-col gap-1">
        <div className="mb-3 flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={userName ?? user.email ?? "Profile"}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
              {(user.email?.[0] ?? "?").toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {userName ? t("helloUser").replace("{name}", userName) : user.email}
            </p>
            {userName && (
              <p className="truncate text-xs text-[var(--muted-foreground)]">{user.email}</p>
            )}
          </div>
        </div>
        <Link href="/dashboard" onClick={onNavigate} className={linkClass}>
          {t("myDashboard")}
        </Link>
        {favoritesLink}
        <Link href="/dashboard/settings" onClick={onNavigate} className={linkClass}>
          {t("contactSettings")}
        </Link>
        <button
          type="button"
          onClick={() => { handleLogout(); onNavigate?.(); }}
          className={`${linkClass} mt-2 w-full text-left text-[var(--muted-foreground)]`}
        >
          {t("logOut")}
        </button>
      </nav>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setUserMenuOpen((o) => !o)}
        className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[11px] font-medium text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--border)] transition-colors"
        aria-expanded={userMenuOpen}
        aria-haspopup="menu"
        aria-label={t("accountMenu")}
      >
        <span className="hidden max-w-[120px] truncate sm:inline">{user.email}</span>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={userName ?? user.email ?? "Profile"}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-foreground)]">
            {(user.email?.[0] ?? "?").toUpperCase()}
          </span>
        )}
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {userMenuOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-1 shadow-[var(--shadow-lg)]"
          role="menu"
        >
          <div className="border-b border-[var(--border)] px-3 py-2">
            <p className="truncate text-[11px] font-medium text-[var(--foreground)]">
              {userName ? t("helloUser").replace("{name}", userName) : user.email}
            </p>
            <p className="truncate text-[10px] text-[var(--muted-foreground)]">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => { setUserMenuOpen(false); onNavigate?.(); }}
            className="block px-3 py-2 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
            role="menuitem"
          >
            {t("myDashboard")}
          </Link>
          <Link
            href="/favorites"
            onClick={() => { setUserMenuOpen(false); onNavigate?.(); }}
            className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
            role="menuitem"
          >
            <span>{t("myFavorites")}</span>
            {favCount > 0 && (
              <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent-foreground)]">
                {favCount > 99 ? "99+" : favCount}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => { setUserMenuOpen(false); onNavigate?.(); }}
            className="block px-3 py-2 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
            role="menuitem"
          >
            {t("contactSettings")}
          </Link>
          <div className="border-t border-[var(--border)]" />
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full px-3 py-2 text-left text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
            role="menuitem"
          >
            {t("logOut")}
          </button>
        </div>
      )}
    </div>
  );
}
