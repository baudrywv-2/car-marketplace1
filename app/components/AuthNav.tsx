"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useLocale } from "@/app/contexts/LocaleContext";

type Props = { mobile?: boolean; onNavigate?: () => void };

export default function AuthNav({ mobile, onNavigate }: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserName(null);
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
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (!cancelled) {
          const name = (data as { full_name?: string | null } | null)?.full_name;
          setUserName(name && typeof name === "string" ? name.trim() : null);
        }
      } catch {
        if (!cancelled) setUserName(null);
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

  const linkClass = `text-[11px] font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors ${mobile ? "block py-2.5" : ""}`;

  if (!user) {
    return (
      <nav className={mobile ? "flex flex-col gap-1" : "flex items-center gap-5"}>
        <Link href="/favorites" onClick={onNavigate} className={linkClass}>
          {t("myFavorites")}
        </Link>
        <Link href="/login" onClick={onNavigate} className={linkClass}>
          {t("logIn")}
        </Link>
        <Link
          href="/signup"
          onClick={onNavigate}
          className="btn-accent inline-flex py-2 px-4 text-[11px] font-semibold"
        >
          {t("signUp")}
        </Link>
      </nav>
    );
  }

  if (mobile) {
    return (
      <nav className="flex flex-col gap-1">
        <Link href="/dashboard" onClick={onNavigate} className={linkClass}>
          {t("myDashboard")}
        </Link>
        <Link href="/favorites" onClick={onNavigate} className={linkClass}>
          {t("myFavorites")}
        </Link>
        <Link href="/dashboard/settings" onClick={onNavigate} className={linkClass}>
          {t("contactSettings")}
        </Link>
        <div className="my-2 border-t border-[var(--border)]" />
        <p className="py-1 text-[11px] font-medium text-[var(--foreground)]">
          {userName ? t("helloUser").replace("{name}", userName) : user.email}
        </p>
        <p className="text-[10px] truncate text-[var(--muted-foreground)]">{user.email}</p>
        <button
          type="button"
          onClick={() => { handleLogout(); onNavigate?.(); }}
          className={`${linkClass} text-left`}
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
        aria-label="Account menu"
      >
        <span className="hidden max-w-[120px] truncate sm:inline">{user.email}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-foreground)]">
          {(user.email?.[0] ?? "?").toUpperCase()}
        </span>
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
            className="block px-3 py-2 text-[11px] font-medium text-[var(--foreground)] hover:bg-[var(--border)]"
            role="menuitem"
          >
            {t("myFavorites")}
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
