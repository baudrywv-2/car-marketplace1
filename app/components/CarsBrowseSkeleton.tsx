import CarCardSkeleton from "@/app/components/CarCardSkeleton";

/** Browse route + client loading placeholder — matches /cars layout. */
export default function CarsBrowseSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6" aria-busy="true" aria-label="Loading">
      <div className="mb-3 space-y-2 sm:mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-11 max-w-xl flex-1 animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
          <div className="flex gap-2">
            <div className="h-10 w-28 animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
            <div className="h-10 w-24 animate-pulse rounded-[var(--radius)] bg-[var(--border)] md:hidden" />
          </div>
        </div>
      </div>
      <div className="flex gap-6">
        <aside className="hidden w-52 shrink-0 space-y-3 md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[var(--radius)] bg-[var(--border)]" />
          ))}
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[var(--border)]" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <CarCardSkeleton key={i} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
