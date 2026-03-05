"use client";

import { useState } from "react";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useToast } from "@/app/contexts/ToastContext";
import { readGuestFavorites, writeGuestFavorites } from "@/lib/guest-favorites";

type Props = {
  carId: string;
  isFav: boolean;
  onToggle: (nextFav: boolean) => void;
  loggedIn: boolean;
  className?: string;
  /** When true, render as icon-only overlay (e.g. on cards). When false, render as inline button (e.g. detail page). */
  variant?: "icon" | "button";
};

export default function FavoriteButton({ carId, isFav, onToggle, loggedIn, className = "", variant = "icon" }: Props) {
  const { t } = useLocale();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (!loggedIn) {
      const next = !isFav;
      const current = readGuestFavorites();
      if (next) writeGuestFavorites([...current, carId]);
      else writeGuestFavorites(current.filter((id) => id !== carId));
      onToggle(next);
      toast.success(next ? t("addedToFavorites") : t("removedFromFavorites"));
      return;
    }

    setLoading(true);
    try {
      if (isFav) {
        const res = await fetch(`/api/favorites?carId=${encodeURIComponent(carId)}`, { method: "DELETE", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          onToggle(false);
          toast.success(t("removedFromFavorites"));
        } else {
          const msg = (data as { error?: string }).error;
          toast.error(msg === "Unauthorized" ? (t("pleaseLogInAgain") ?? "Please log in again to manage favorites.") : (msg || "Could not remove from favorites"));
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carId }),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          onToggle(true);
          toast.success(t("addedToFavorites"));
        } else {
          const msg = (data as { error?: string }).error;
          toast.error(msg === "Unauthorized" ? (t("pleaseLogInAgain") ?? "Please log in again to save favorites.") : (msg || "Could not add to favorites"));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const label = isFav ? t("removeFromFavorites") : t("addToFavorites");
  const icon = (
    <svg
      className="h-5 w-5"
      fill={isFav ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-50 ${className}`}
        title={label}
        aria-label={label}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`btn-secondary inline-flex items-center gap-2 disabled:opacity-50 ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
