"use client";

export default function CarCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "card-compact overflow-hidden" : "card-premium overflow-hidden"}>
      <div className={`animate-pulse bg-[var(--border)] ${compact ? "aspect-[4/3]" : "aspect-video"}`} />
      <div className={compact ? "p-2.5" : "p-4"}>
        <div className={`h-4 rounded bg-[var(--border)] ${compact ? "w-3/4" : "w-full"}`} />
        <div className={`mt-2 h-3 w-1/2 rounded bg-[var(--border)] ${compact ? "mt-1" : ""}`} />
        <div className={`mt-2 h-4 w-1/3 rounded bg-[var(--border)] ${compact ? "mt-1" : "mt-2"}`} />
      </div>
    </div>
  );
}
