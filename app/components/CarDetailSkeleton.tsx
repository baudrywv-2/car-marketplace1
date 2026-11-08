/** Listing detail loading placeholder — matches /cars/[id] layout. */
export default function CarDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 pb-28 sm:px-6 sm:py-10" aria-busy="true" aria-label="Loading">
      <div className="mb-4 h-4 w-48 animate-pulse rounded bg-[var(--border)]" />
      <div className="mb-6 h-10 w-40 animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
          <div className="aspect-video animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
          <div className="space-y-3">
            <div className="h-7 w-4/5 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-8 w-1/2 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-24 w-full animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
            <div className="h-12 w-full animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
            <div className="h-28 w-full animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
          </div>
        </div>
      </div>
      <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 flex gap-2 border-t border-[var(--border)] bg-[var(--background)] p-4 sm:hidden">
        <div className="h-12 flex-1 animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
        <div className="h-12 w-12 animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
      </div>
    </div>
  );
}
