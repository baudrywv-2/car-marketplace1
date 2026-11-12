"use client";

export default function CarCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "card-compact overflow-hidden" : "card-premium overflow-hidden"}>
      <div
        className={`animate-pulse bg-[var(--border)] ${
          compact ? "aspect-[2/1] sm:aspect-[5/3]" : "aspect-[16/10] sm:aspect-[4/3]"
        }`}
      />
      <div className={compact ? "space-y-1 p-1 sm:p-2" : "space-y-1 p-1.5 sm:p-2.5"}>
        <div className={`h-2.5 rounded bg-[var(--border)] ${compact ? "w-2/3" : "w-3/4"}`} />
        <div className="h-3 w-full rounded bg-[var(--border)]" />
        <div className={`h-3 rounded bg-[var(--border)] ${compact ? "w-1/3" : "w-2/5"}`} />
      </div>
    </div>
  );
}
