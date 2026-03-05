"use client";

/** Placeholder when a car has no photo – car silhouette icon */
export default function CarImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 bg-[var(--border)] text-[var(--muted-foreground)] ${className}`}
      aria-hidden
    >
      <svg className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-[10px] sm:text-xs font-medium">No photo</span>
    </div>
  );
}
