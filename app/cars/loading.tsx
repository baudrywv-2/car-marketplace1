export default function CarsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-[var(--border)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
            <div className="aspect-[4/3] animate-pulse bg-[var(--border)]" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--border)]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
